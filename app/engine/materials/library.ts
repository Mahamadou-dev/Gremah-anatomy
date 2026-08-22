import * as THREE from "three";
import type { RenderBackend } from "../core/renderer";
import {
  GHOST_DEFAULTS,
  TISSUE_DEFAULTS,
  XRAY_DEFAULTS,
  materialBudget,
  tissueForBudget,
  type MaterialBudget,
  type ViewMode,
} from "./params";

/**
 * Bibliothèque de matériaux signature.
 *
 * Contrainte structurante : le même code doit produire un résultat équivalent
 * sous WebGPU et sous WebGL2. Trois des quatre matériaux y arrivent sans shader
 * custom — ils n'utilisent que des paramètres que les deux backends implémentent
 * nativement. Seule la translucidité des tissus demande une injection, faite en
 * GLSL sur WebGL2 et en TSL sur WebGPU, derrière la même API.
 *
 * Ce choix n'est pas de la paresse : un shader custom par matériau, c'est deux
 * implémentations à maintenir, deux occasions d'écran noir, et zéro bénéfice
 * visible sur un organe affiché dans 400 px.
 */

/** Les matériaux d'origine d'un maillage, pour pouvoir revenir en arrière. */
type OriginalMaterial = { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] };

export class MaterialLibrary {
  private backend: RenderBackend;
  private budget: MaterialBudget;
  private originals: OriginalMaterial[] = [];
  /** Matériaux créés ici, donc à libérer ici. */
  private owned = new Set<THREE.Material>();
  private mode: ViewMode = "tissu";
  /** Vrai si l'injection de translucidité a pu être posée sur ce backend. */
  private subsurfaceActive = false;

  constructor(backend: RenderBackend, profile: "low" | "medium" | "high") {
    this.backend = backend;
    this.budget = materialBudget(profile);
  }

  get status() {
    return { mode: this.mode, subsurface: this.subsurfaceActive };
  }

  setProfile(profile: "low" | "medium" | "high") {
    this.budget = materialBudget(profile);
  }

  /**
   * Enrichit les matériaux d'un organe fraîchement chargé.
   *
   * On n'échange pas le matériau : le glTF porte ses cartes (albédo, normale,
   * rugosité) et les recréer coûterait une reconstruction de texture par organe.
   * On augmente celui qui existe — c'est aussi ce qui garantit que la vue « tissu »
   * reste exactement le rendu validé au Sprint 1.
   */
  enhance(meshes: THREE.Mesh[], accent?: string) {
    const accentColor = accent ? new THREE.Color(accent) : null;
    for (const material of collect(meshes)) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      if (accentColor && isUntextured(material)) {
        // Certains modèles importés (Sprint 12, pipeline Blender → Z-Anatomy)
        // sortent sans matériau exploitable : blanc plat, parfois même un nom de
        // matériau hérité d'une tout autre structure. Un organe blanc n'est pas
        // un choix esthétique, c'est un champ vide — on le comble avec la teinte
        // déjà choisie pour cet organe (`organes.ts`) plutôt que de l'exposer.
        material.color.copy(accentColor).lerp(new THREE.Color(0xffffff), 0.5);
      }
    }

    const params = tissueForBudget(TISSUE_DEFAULTS, this.budget);
    if (params.subsurfaceStrength <= 0) {
      this.subsurfaceActive = false;
      return;
    }

    const tint = new THREE.Color(params.subsurfaceColor);
    for (const material of collect(meshes)) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      if (this.backend === "webgl2")
        this.injectTranslucency(material, tint, params.subsurfacePower);
      else this.approximateTranslucency(material, tint, params.subsurfaceStrength);
      if (params.sheen > 0 && "sheen" in material) {
        const physical = material as THREE.MeshPhysicalMaterial;
        // L'aspect humide d'un organe frais : un lobe large et discret. Poussé
        // plus loin, il vire au satin et l'organe redevient un objet manufacturé.
        physical.sheen = params.sheen;
        physical.sheenRoughness = 0.75;
        physical.sheenColor = new THREE.Color(0xffe8dd);
      }
      material.needsUpdate = true;
    }
    this.subsurfaceActive = true;
  }

  /**
   * Translucidité de bord en GLSL.
   *
   * Approximation par fresnel, pas transport volumique : la lumière qui traverse
   * quelques millimètres de tissu ressort surtout là où le tissu est mince, donc
   * sur les silhouettes. C'est ce que l'œil lit comme « de la chair », et ça coûte
   * trois instructions par pixel au lieu d'un ray-march.
   */
  private injectTranslucency(
    material: THREE.MeshStandardMaterial,
    tint: THREE.Color,
    power: number,
  ) {
    const strength = tissueForBudget(TISSUE_DEFAULTS, this.budget).subsurfaceStrength;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSubsurfaceColor = { value: tint };
      shader.uniforms.uSubsurfaceStrength = { value: strength };
      shader.uniforms.uSubsurfacePower = { value: power };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "void main() {",
          `uniform vec3 uSubsurfaceColor;
           uniform float uSubsurfaceStrength;
           uniform float uSubsurfacePower;
           void main() {`,
        )
        // `totalEmissiveRadiance` existe à partir d'ici et sera ajouté à la
        // sortie après l'éclairage : c'est le seul point d'insertion qui ne
        // perturbe ni le PBR ni les ombres.
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           float rim = 1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition)));
           totalEmissiveRadiance += uSubsurfaceColor * pow(rim, uSubsurfacePower) * uSubsurfaceStrength;`,
        );
    };
    // Sans cette clé, three réutiliserait le programme compilé de la variante
    // non injectée et l'ajout serait silencieusement ignoré.
    material.customProgramCacheKey = () => `gremah-sss-${power}-${strength}`;
  }

  /**
   * Variante WebGPU. Le pipeline de nœuds n'accepte pas `onBeforeCompile`, et
   * réécrire le modèle d'éclairage en TSL pour un terme de bord coûterait plus
   * cher en risque qu'il ne rapporte : on approxime par une émissive teintée,
   * modulée par la rugosité. Moins fin sur les silhouettes, même famille de rendu.
   */
  private approximateTranslucency(
    material: THREE.MeshStandardMaterial,
    tint: THREE.Color,
    strength: number,
  ) {
    material.emissive = tint.clone();
    material.emissiveIntensity = strength * 0.22;
  }

  /**
   * Bascule de vue. Les matériaux d'origine sont mémorisés au premier changement
   * et restaurés au retour : rien n'est détruit, donc revenir en « tissu » ne
   * coûte pas un rechargement.
   */
  setMode(meshes: THREE.Mesh[], mode: ViewMode) {
    if (mode === this.mode) return this.mode;
    if (!this.originals.length) {
      this.originals = meshes.map((mesh) => ({ mesh, material: mesh.material }));
    }

    if (mode === "tissu") {
      this.originals.forEach(({ mesh, material }) => (mesh.material = material));
    } else {
      const material = mode === "rayon-x" ? this.createXray() : this.createGhost();
      meshes.forEach((mesh) => (mesh.material = material));
    }

    this.mode = mode;
    return this.mode;
  }

  /**
   * Radiographie : additif et double-face.
   *
   * L'accumulation fait tout le travail — là où le rayon traverse plus de tissu,
   * plus de fragments s'additionnent, donc c'est plus lumineux. C'est exactement
   * la physique d'une radiographie, et ça sort du même code sur les deux backends
   * parce que le mélange additif n'est pas un shader mais un état de pipeline.
   */
  private createXray() {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(XRAY_DEFAULTS.color),
      transparent: true,
      opacity: XRAY_DEFAULTS.opacity,
      blending: THREE.AdditiveBlending,
      // La profondeur doit rester lisible : écrire dedans masquerait les couches
      // internes, c'est-à-dire tout l'intérêt de la vue.
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.owned.add(material);
    return material;
  }

  /** Couche de contexte : présente, jamais lisible, jamais cliquable visuellement. */
  private createGhost() {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(GHOST_DEFAULTS.color),
      transparent: true,
      opacity: GHOST_DEFAULTS.opacity,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0,
      side: THREE.FrontSide,
    });
    this.owned.add(material);
    return material;
  }

  /** L'organe a changé : les références mémorisées ne valent plus rien. */
  reset() {
    this.originals = [];
    this.mode = "tissu";
  }

  dispose() {
    this.owned.forEach((material) => material.dispose());
    this.owned.clear();
    this.originals = [];
  }
}

/** Pas de carte d'albédo et une couleur proche du blanc ou du gris neutre par
 *  défaut de l'exportateur — donc rien à perdre à la teinter. */
function isUntextured(material: THREE.MeshStandardMaterial) {
  if (material.map) return false;
  const { r, g, b } = material.color;
  const neutral = Math.abs(r - g) < 0.02 && Math.abs(g - b) < 0.02;
  return neutral && r > 0.55;
}

function collect(meshes: THREE.Mesh[]) {
  const list: THREE.Material[] = [];
  meshes.forEach((mesh) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => list.includes(material) || list.push(material));
  });
  return list;
}
