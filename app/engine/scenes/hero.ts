import * as THREE from "three";
import { createRenderer, type AnatomyRenderer } from "../core/renderer";
import { resolveQuality, type QualitySettings } from "../core/capabilities";
import { AnatomyAssetManager } from "../loaders/assets";
import { memoryBudgetBytes } from "../loaders/lod";
import { disposeObject } from "../loaders/dispose";

/**
 * La scène d'accueil : un organe suspendu dans le disque solaire, qui respire.
 *
 * Volontairement distincte de `AnatomyViewer`. L'atlas est un outil — il doit
 * rester froid, précis, et ne rien dessiner quand rien ne bouge. L'accueil est
 * une vitrine : elle a le droit d'animer en continu, mais seulement tant qu'elle
 * est réellement à l'écran et que l'appareil peut se le permettre. C'est
 * exactement la raison pour laquelle les deux ne partagent pas le même moteur :
 * mélanger les deux régimes aurait pollué la discipline render-on-demand de l'atlas.
 *
 * Zéro import React (CLAUDE.md §4).
 */

/** Organes présentés en boucle, du plus lisible au plus spectaculaire. */
export const HERO_ORGANS = [
  { id: "heart", url: "/models/heart-lod2.glb", accent: "#ff6b52", label: "Cœur" },
  { id: "brain", url: "/models/brain-lod2.glb", accent: "#c58cff", label: "Encéphale" },
  { id: "lungs", url: "/models/lungs-lod2.glb", accent: "#68c9ff", label: "Poumons" },
  { id: "kidneys", url: "/models/kidneys-lod2.glb", accent: "#ffa33d", label: "Reins" },
] as const;

export type HeroOrgan = (typeof HERO_ORGANS)[number];

export type HeroCallbacks = {
  /** Appelé quand le premier organe est visible : le poster peut s'effacer. */
  onReady?: () => void;
  /** Appelé à chaque bascule d'organe, pour synchroniser la légende. */
  onOrganChange?: (organ: HeroOrgan, index: number) => void;
  /** Aucun contexte GPU disponible : l'appelant affiche le repli statique. */
  onFailure?: () => void;
};

/** Durée d'affichage d'un organe avant la bascule suivante, en secondes. */
const DWELL_SECONDS = 7;
/** Durée du fondu croisé entre deux organes. */
const CROSSFADE_SECONDS = 1.1;

export class HeroScene {
  private renderer: AnatomyRenderer | null = null;
  private assets: AnatomyAssetManager | null = null;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly stage = new THREE.Group();
  private readonly quality: QualitySettings;
  private readonly reducedMotion: boolean;
  private readonly callbacks: HeroCallbacks;
  private readonly host: HTMLElement;

  private halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | null = null;
  private motes: THREE.Points | null = null;
  private accentLight: THREE.PointLight;
  private current: THREE.Group | null = null;
  private outgoing: THREE.Group | null = null;

  private frame = 0;
  private elapsed = 0;
  private clock = new THREE.Clock();
  private index = 0;
  private crossfade = 0;
  private swapping = false;
  private visible = false;
  private disposed = false;

  /** Cible et valeur lissée du pointeur, en −1..1 sur les deux axes. */
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  /** Progression de défilement 0..1 fournie par le composant React. */
  private scroll = 0;
  private scrollSmoothed = 0;

  private observer: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(host: HTMLElement, callbacks: HeroCallbacks = {}) {
    this.host = host;
    this.callbacks = callbacks;

    const resolved = resolveQuality();
    this.quality = resolved.settings;
    this.reducedMotion = resolved.signals.reducedMotion;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    this.camera.position.set(0, 0.15, 8.4);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(this.stage);
    this.accentLight = new THREE.PointLight(0xff6b52, 3.2, 14, 2);
    this.buildDecor();
  }

  async start() {
    try {
      this.renderer = await createRenderer({ quality: this.quality });
    } catch {
      this.callbacks.onFailure?.();
      return;
    }
    if (this.disposed) {
      this.renderer.dispose();
      return;
    }

    const canvas = this.renderer.domElement;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Organes humains en trois dimensions tournant lentement au-dessus d'un halo orange",
    );
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    this.host.appendChild(canvas);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.maxPixelRatio));
    this.resize();

    const signals = resolveQuality().signals;
    this.assets = new AnatomyAssetManager(
      this.renderer,
      // L'accueil ne garde en mémoire que les quatre aperçus les plus légers ;
      // un tiers du budget de l'atlas suffit largement et laisse la place au
      // vrai viewer si l'étudiant enchaîne directement.
      Math.round(memoryBudgetBytes(signals.deviceMemory, signals.coarsePointer) / 3),
    );

    // L'observateur suspend tout hors écran : sur un téléphone, une boucle
    // d'animation qui tourne derrière trois écrans de texte coûte de la batterie
    // pour zéro pixel visible.
    this.observer = new IntersectionObserver(([entry]) => this.setVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    this.observer.observe(this.host);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    await this.show(0, { instant: true });
    this.callbacks.onReady?.();
    this.setVisible(true);
  }

  /** Position du pointeur normalisée en −1..1 ; pilote la parallaxe. */
  setPointer(x: number, y: number) {
    if (this.reducedMotion) return;
    this.pointerTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
  }

  /** Progression du défilement dans le héros, 0 en haut, 1 quand il sort. */
  setScroll(progress: number) {
    this.scroll = THREE.MathUtils.clamp(progress, 0, 1);
  }

  /** Bascule manuelle depuis la légende cliquable. */
  select(index: number) {
    if (index === this.index || this.swapping) return;
    void this.show(index);
  }

  private setVisible(next: boolean) {
    if (next === this.visible) return;
    this.visible = next;
    if (next && !this.disposed) {
      this.clock.getDelta(); // absorbe le temps passé en pause
      this.loop();
    } else if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private onVisibilityChange = () => {
    this.setVisible(document.visibilityState === "visible" && this.host.isConnected);
  };

  private buildDecor() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    this.scene.add(new THREE.HemisphereLight(0xfff8ee, 0x2a1d16, 0.8));

    // Éclairage trois points de la charte : key solaire chaude, fill vert-froid,
    // rim orange (CLAUDE.md §6). Décalé vers la clé par rapport à l'atlas :
    // une vitrine assume un contraste plus théâtral qu'un outil d'étude.
    const key = new THREE.DirectionalLight(0xfff1de, 4.2);
    key.position.set(5.2, 6.2, 6.4);
    const fill = new THREE.DirectionalLight(0xd8f0e2, 0.95);
    fill.position.set(-5.4, 0.6, 4.2);
    const rim = new THREE.DirectionalLight(0xff9a5e, 2.4);
    rim.position.set(-3.2, 2.6, -6.2);
    this.scene.add(key, fill, rim, this.accentLight);
    this.accentLight.position.set(2.6, 0.8, 3.2);

    // Le disque solaire du drapeau, en lumière et non en aplat.
    this.halo = new THREE.Mesh(
      new THREE.RingGeometry(1.9, 4.6, this.quality.profile === "low" ? 40 : 96),
      new THREE.MeshBasicMaterial({
        map: haloTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    this.halo.position.z = -2.6;
    this.scene.add(this.halo);

    if (this.quality.particleCount > 0) {
      this.motes = buildMotes(this.quality.particleCount * 2);
      this.scene.add(this.motes);
    }
  }

  private async show(index: number, { instant = false } = {}) {
    const target = HERO_ORGANS[index];
    if (!this.assets || !target) return;
    this.swapping = true;
    try {
      const loaded = await this.assets.load(target.url, { level: 2 });
      if (this.disposed) return;

      // Le manager met en cache le pivot lui-même : le cloner évite que deux
      // organes affichés en fondu se disputent le même objet de scène.
      const pivot = loaded.pivot.clone(true);
      pivot.scale.setScalar(1.15);
      pivot.position.y = -0.1;
      setOpacity(pivot, instant ? 1 : 0);

      this.outgoing = this.current;
      this.current = pivot;
      this.stage.add(pivot);
      this.index = index;
      this.crossfade = instant ? 1 : 0;
      this.accentLight.color.set(target.accent);
      this.callbacks.onOrganChange?.(target, index);
      this.elapsed = 0;
    } catch {
      // Un aperçu manquant ne doit pas figer le carrousel : on garde l'organe
      // courant et la prochaine bascule réessaiera le suivant.
      this.elapsed = 0;
    } finally {
      this.swapping = false;
    }
  }

  private loop = () => {
    if (this.disposed || !this.renderer) return;
    this.frame = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += delta;

    // Amortissement exponentiel indépendant du framerate : sans le `1 - e^…`,
    // la parallaxe serait deux fois plus rapide sur un écran 120 Hz.
    const ease = 1 - Math.exp(-6 * delta);
    this.pointer.lerp(this.pointerTarget, ease);
    this.scrollSmoothed += (this.scroll - this.scrollSmoothed) * ease;

    if (this.crossfade < 1) {
      this.crossfade = Math.min(1, this.crossfade + delta / CROSSFADE_SECONDS);
      const eased = this.crossfade * this.crossfade * (3 - 2 * this.crossfade);
      if (this.current) setOpacity(this.current, eased);
      if (this.outgoing) setOpacity(this.outgoing, 1 - eased);
      if (this.crossfade >= 1 && this.outgoing) {
        this.stage.remove(this.outgoing);
        disposeObject(this.outgoing);
        this.outgoing = null;
      }
    }

    const t = this.clock.elapsedTime;

    if (this.current) {
      // Rotation lente + léger flottement : deux fréquences non harmoniques,
      // pour que la boucle ne se laisse jamais deviner.
      if (!this.reducedMotion) {
        this.current.rotation.y += delta * 0.22;
        this.current.position.y = -0.1 + Math.sin(t * 0.62) * 0.08;
        this.current.rotation.x = Math.sin(t * 0.41) * 0.05;
      }
      if (this.outgoing) {
        this.outgoing.rotation.y += delta * 0.22;
        this.outgoing.scale.multiplyScalar(1 - delta * 0.28);
      }
    }

    // La parallaxe bouge la caméra, pas l'organe : incliner le modèle donnerait
    // une lecture anatomique fausse dès qu'on lâche la souris.
    const parallax = 1 - this.scrollSmoothed * 0.6;
    this.camera.position.x = this.pointer.x * 0.55 * parallax;
    this.camera.position.y = 0.15 + this.pointer.y * 0.32 * parallax;
    // Le héros s'éloigne et s'efface à mesure qu'on descend : la 3D cède la
    // place au texte au lieu de lui faire concurrence.
    this.camera.position.z = 8.4 + this.scrollSmoothed * 3.2;
    this.camera.lookAt(0, this.scrollSmoothed * -0.5, 0);

    if (this.halo) {
      this.halo.material.opacity = 0.72 * (1 - this.scrollSmoothed * 0.8);
      if (!this.reducedMotion) this.halo.rotation.z += delta * 0.035;
    }
    if (this.motes && !this.reducedMotion) {
      this.motes.rotation.y += delta * 0.018;
      this.motes.position.y = Math.sin(t * 0.24) * 0.12;
    }

    // Bascule automatique. `reducedMotion` la conserve — c'est un changement de
    // contenu, pas un mouvement — mais l'allonge pour laisser le temps de lire.
    const dwell = this.reducedMotion ? DWELL_SECONDS * 1.8 : DWELL_SECONDS;
    if (this.elapsed > dwell && !this.swapping && this.crossfade >= 1) {
      void this.show((this.index + 1) % HERO_ORGANS.length);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private resize() {
    if (!this.renderer) return;
    const width = this.host.clientWidth || 1;
    const height = this.host.clientHeight || 1;
    this.camera.aspect = width / height;
    // Sur un téléphone en portrait, un cadrage calé sur la largeur rétrécit
    // l'organe jusqu'à l'illisible : on élargit le champ quand le format se resserre.
    this.camera.fov = THREE.MathUtils.clamp(38 / Math.min(1, this.camera.aspect / 1.2), 38, 62);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  dispose() {
    this.disposed = true;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();

    if (this.current) disposeObject(this.current);
    if (this.outgoing) disposeObject(this.outgoing);
    this.halo?.geometry.dispose();
    this.halo?.material.map?.dispose();
    this.halo?.material.dispose();
    this.motes?.geometry.dispose();
    (this.motes?.material as THREE.Material | undefined)?.dispose();
    this.scene.clear();

    this.assets?.dispose();
    this.renderer?.domElement.remove();
    this.renderer?.dispose();
    this.renderer = null;
  }
}

/** Applique une opacité uniforme à tout un sous-arbre, pour le fondu croisé. */
function setOpacity(root: THREE.Object3D, value: number) {
  root.visible = value > 0.001;
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      material.transparent = value < 0.999;
      material.opacity = value;
      // Sans couper l'écriture de profondeur pendant le fondu, les faces
      // arrière de l'organe entrant masquent ses propres faces avant.
      material.depthWrite = value >= 0.999;
    }
  });
}

/**
 * Le disque solaire : trois arrêts, chaud au centre, éteint au bord. Généré
 * plutôt que téléchargé — le budget réseau du projet ne finance pas un dégradé.
 */
function haloTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, size * 0.2, c, c, size * 0.5);
  gradient.addColorStop(0, "rgba(244, 163, 28, 0.62)");
  gradient.addColorStop(0.4, "rgba(224, 82, 6, 0.3)");
  gradient.addColorStop(0.78, "rgba(13, 176, 43, 0.07)");
  gradient.addColorStop(1, "rgba(224, 82, 6, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Poussière lumineuse en coquille sphérique : elle enveloppe l'organe. */
function buildMotes(count: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 3.2 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.55;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 1.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xf4a31c,
      size: 0.026,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
}
