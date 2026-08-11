import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { disposeObject } from "./dispose";
import type { AnatomyRenderer } from "../core/renderer";
import { estimateResidentBytes, lodUrl, type LodLevel } from "./lod";

/** Edge length of the cube every organ is normalised into, so hotspot
 *  coordinates authored in `anatomy-data` mean the same thing for each model. */
export const FIT_SIZE = 3.8;

/**
 * Plafond de sécurité en nombre d'entrées, doublant le budget en octets.
 * Le budget réel est `memoryBudgetBytes()` : cette limite n'existe que pour le cas
 * dégénéré d'organes minuscules, où mille entrées tiendraient sous le budget tout
 * en saturant les handles GPU.
 */
const CACHE_LIMIT = 8;

export type LoadedOrgan = {
  url: string;
  /** Niveau de détail réellement chargé. */
  level: LodLevel;
  /** Hotspot space: the fitted model, centred on the origin, spanning FIT_SIZE. */
  pivot: THREE.Group;
  meshes: THREE.Mesh[];
  mixer: THREE.AnimationMixer | null;
  /** Empreinte mémoire estimée, base de la politique d'éviction. */
  bytes: number;
};

export type LoadOptions = {
  level: LodLevel;
  onProgress?: (progress: number) => void;
};

export class AnatomyAssetManager {
  private loader: GLTFLoader;
  private draco: DRACOLoader | null = null;
  private ktx2: KTX2Loader | null = null;
  private cache = new Map<string, LoadedOrgan>();
  private inflight = new Map<string, Promise<LoadedOrgan>>();
  private current: LoadedOrgan | null = null;
  private maxAnisotropy: number;
  private budgetBytes: number;

  constructor(renderer: AnatomyRenderer, budgetBytes: number) {
    // L'anisotropie est ce qui empêche le détail des textures de ramper aux angles
    // rasants — l'essentiel du scintillement sur un organe qui tourne. Le plafond
    // vient du profil de qualité : sur `low` elle est le premier poste sacrifié.
    this.maxAnisotropy = renderer.maxAnisotropy;
    this.budgetBytes = budgetBytes;
    this.loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

    // Draco et KTX2 sont câblés même si le pipeline actuel produit du meshopt +
    // WebP : les décodeurs sont déjà dans `public/`, ils décodent en worker, et
    // un modèle tiers en Draco doit s'ouvrir sans changer une ligne de code.
    // Si le WASM manque, `setDecoderPath` échoue au chargement du modèle concerné
    // seulement — les autres organes continuent de s'afficher.
    try {
      this.draco = new DRACOLoader().setDecoderPath("/draco/");
      this.loader.setDRACOLoader(this.draco);
      this.ktx2 = new KTX2Loader().setTranscoderPath("/basis/");
      // Le transcodeur doit connaître les formats compressés du GPU pour choisir
      // sa cible (ASTC, ETC2, BC7…). Sans ça il déballerait tout en RGBA non
      // compressé, ce qui coûterait plus cher que de ne pas utiliser KTX2.
      if (renderer.backend === "webgl2")
        this.ktx2.detectSupport(renderer.raw as THREE.WebGLRenderer);
      this.loader.setKTX2Loader(this.ktx2);
    } catch {
      // Environnement sans Worker ni WASM : on garde le chemin meshopt, qui suffit
      // aux assets du dépôt.
    }
  }

  get hasAnimation() {
    return Boolean(this.current?.mixer);
  }

  /**
   * Réchauffe le cache HTTP au survol. On ne préfetch que le niveau le plus léger :
   * spéculer sur 1 Mo alors que l'étudiant paie son forfait au mégaoctet serait
   * exactement le comportement que ce projet refuse.
   */
  prefetch(baseUrl: string, level: LodLevel) {
    const url = lodUrl(baseUrl, level);
    if (this.cache.has(url) || this.inflight.has(url)) return;
    void fetch(url, { priority: "low" } as RequestInit).catch(() => {});
  }

  /** Vrai si ce niveau est déjà en mémoire — l'afficher ne coûtera rien. */
  isResident(baseUrl: string, level: LodLevel) {
    return this.cache.has(lodUrl(baseUrl, level));
  }

  async load(baseUrl: string, { level, onProgress }: LoadOptions): Promise<LoadedOrgan> {
    const url = lodUrl(baseUrl, level);
    const cached = this.cache.get(url);
    if (cached) {
      this.cache.delete(url);
      this.cache.set(url, cached);
      this.resetMaterials(cached);
      onProgress?.(1);
      this.current = cached;
      return cached;
    }

    const pending = this.inflight.get(url) ?? this.parse(url, level, onProgress);
    this.inflight.set(url, pending);
    try {
      const organ = await pending;
      this.cache.set(url, organ);
      this.evict();
      this.current = organ;
      return organ;
    } finally {
      this.inflight.delete(url);
    }
  }

  private async parse(
    url: string,
    level: LodLevel,
    onProgress?: (progress: number) => void,
  ): Promise<LoadedOrgan> {
    let downloadedBytes = 0;
    const gltf = await this.loader.loadAsync(url, (event) => {
      downloadedBytes = Math.max(downloadedBytes, event.loaded);
      if (event.total > 0) onProgress?.(event.loaded / event.total);
    });

    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001);
    model.scale.setScalar(scale);
    model.position.copy(center.multiplyScalar(-scale));

    // The pivot is what the viewer animates and what hotspots are parented to,
    // so hotspot coordinates stay in the normalised FIT_SIZE space.
    const pivot = new THREE.Group();
    pivot.name = "organ-pivot";
    pivot.add(model);
    pivot.rotation.set(0.05, -0.28, 0);

    const meshes: THREE.Mesh[] = [];
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      meshes.push(child);
      // One mesh per organ, always centred in frame — culling can only ever
      // cost a wrong answer here, never save work.
      child.frustumCulled = false;
      // Real-time shadow casting is replaced by a baked contact shadow, which
      // saves a full extra pass over the mesh every frame.
      child.castShadow = false;
      child.receiveShadow = false;
      this.forEachMaterial(child, (material) => {
        material.transparent = false;
        material.opacity = 1;
        material.depthWrite = true;
        material.depthTest = true;
        material.side = THREE.FrontSide;
        if (material instanceof THREE.MeshStandardMaterial) {
          // A tighter specular lobe sparkles on any surface with normal detail;
          // holding roughness a little higher keeps highlights stable while the
          // model turns.
          material.roughness = THREE.MathUtils.clamp(material.roughness ?? 0.5, 0.42, 0.62);
          material.metalness = 0;
          material.envMapIntensity = 0.32;
          material.emissive.set(0x000000);
          material.emissiveIntensity = 0;
          if ("clearcoat" in material) {
            const physical = material as THREE.MeshPhysicalMaterial;
            // A second, sharper specular lobe is the main source of crawling
            // highlights, so keep it faint and broad.
            physical.clearcoat = Math.min(Math.max(physical.clearcoat, 0.08), 0.12);
            physical.clearcoatRoughness = 0.62;
            // Volume/transmission are per-pixel expensive and invisible here.
            physical.transmission = 0;
            physical.thickness = 0;
          }
          if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
          if (material.normalMap) material.normalScale.multiplyScalar(0.62);
          // Every sampled map needs anisotropy, not just the base colour —
          // an aliasing normal or roughness map shimmers just as badly.
          for (const map of [
            material.map,
            material.normalMap,
            material.roughnessMap,
            material.metalnessMap,
            material.aoMap,
            material.emissiveMap,
          ]) {
            if (!map) continue;
            map.anisotropy = this.maxAnisotropy;
            map.generateMipmaps = true;
            map.minFilter = THREE.LinearMipmapLinearFilter;
            map.magFilter = THREE.LinearFilter;
            map.needsUpdate = true;
          }
        }
        material.needsUpdate = true;
      });
    });

    let mixer: THREE.AnimationMixer | null = null;
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
    }

    return { url, level, pivot, meshes, mixer, bytes: estimateResidentBytes(downloadedBytes) };
  }

  /** Undoes viewer tools (wireframe, clipping, fade) before a cached organ returns. */
  private resetMaterials(organ: LoadedOrgan) {
    organ.pivot.rotation.set(0.05, -0.28, 0);
    organ.pivot.position.set(0, 0, 0);
    organ.meshes.forEach((mesh) => {
      this.forEachMaterial(mesh, (material) => {
        material.transparent = false;
        material.opacity = 1;
        material.depthWrite = true;
        material.clippingPlanes = null;
        material.clipShadows = false;
        if (material instanceof THREE.MeshStandardMaterial) material.wireframe = false;
        material.needsUpdate = true;
      });
    });
  }

  private forEachMaterial(mesh: THREE.Mesh, fn: (material: THREE.Material) => void) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach(fn);
  }

  /** Octets estimés actuellement retenus par le cache. */
  get residentBytes() {
    let total = 0;
    this.cache.forEach((organ) => (total += organ.bytes));
    return total;
  }

  /**
   * Éviction par budget mémoire, la plus ancienne entrée d'abord.
   *
   * L'organe courant n'est jamais évincé, même s'il dépasse à lui seul le budget :
   * libérer ce qui est à l'écran ne libère rien d'utile et laisse un trou noir à
   * la place du modèle.
   */
  private evict() {
    while (
      this.cache.size > 1 &&
      (this.residentBytes > this.budgetBytes || this.cache.size > CACHE_LIMIT)
    ) {
      const oldest = [...this.cache.keys()].find((key) => this.cache.get(key) !== this.current);
      if (!oldest) return;
      const organ = this.cache.get(oldest);
      this.cache.delete(oldest);
      if (organ) this.destroy(organ);
    }
  }

  private destroy(organ: LoadedOrgan) {
    organ.mixer?.stopAllAction();
    organ.mixer?.uncacheRoot(organ.pivot);
    organ.pivot.removeFromParent();
    disposeObject(organ.pivot);
  }

  update(delta: number) {
    this.current?.mixer?.update(delta);
  }

  /** Detaches from the scene but keeps the organ warm for the next visit. */
  release(organ: LoadedOrgan | null = this.current) {
    if (!organ) return;
    organ.mixer?.stopAllAction();
    organ.pivot.removeFromParent();
    if (organ === this.current) this.current = null;
  }

  dispose() {
    this.release();
    this.cache.forEach((organ) => this.destroy(organ));
    this.cache.clear();
  }
}
