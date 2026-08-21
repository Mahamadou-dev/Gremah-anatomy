import * as THREE from "three";
import gsap from "gsap";
import type { Hotspot } from "../content/organes";
import {
  readSignals,
  resolveQuality,
  qualitySettings,
  writeQualityOverride,
  type QualityProfile,
  type QualitySettings,
} from "./core/capabilities";
import { createRenderer, type AnatomyRenderer } from "./core/renderer";
import { SceneGraph } from "./core/scene-graph";
import { CameraRig, CAMERA_FOV, type CameraPreset } from "./core/camera-rig";
import { RenderLoop } from "./core/render-loop";
import { DebugOverlay, debugRequested } from "./core/stats";
import { InputController, type InputAction } from "./interaction/input-controller";
import { HotspotLayer } from "./interaction/hotspots";
import { AnatomyAssetManager, type LoadedOrgan } from "./loaders/assets";
import { memoryBudgetBytes, selectLevel, PREVIEW_LEVEL, type LodLevel } from "./loaders/lod";
import { MaterialLibrary } from "./materials/library";
import type { ViewMode } from "./materials/params";
import { PostStack, type PostStatus } from "./passes/composer";

/**
 * L'orchestrateur du moteur.
 *
 * Il ne contient plus de scène, de boucle ni d'entrées : il les compose. Chaque
 * responsabilité vit dans `core/`, `interaction/` ou `loaders/`, et aucun de ces
 * modules ne connaît React — la frontière du §4 de CLAUDE.md passe ici et
 * nulle part ailleurs.
 */

export type ViewerCallbacks = {
  onLoading: (loading: boolean, progress: number) => void;
  onSelect: (hotspot: Hotspot | null) => void;
  /** Remonte le backend et le profil réellement obtenus, pour l'affichage. */
  onReady?: (status: EngineStatus) => void;
};

export type EngineStatus = {
  backend: AnatomyRenderer["backend"];
  quality: QualityProfile;
  detected: QualityProfile;
  /** Vrai si l'utilisateur a forcé le profil plutôt que de suivre la détection. */
  overridden: boolean;
  /** Mode de rendu des tissus courant. */
  mode: ViewMode;
  /** État de la pile de post-processing — jamais masqué en cas d'absence. */
  post: PostStatus;
};

const DOT_PIXELS = 34;
const DEPTH_PREPASS = "depth-prepass";

export class AnatomyViewer {
  private renderer: AnatomyRenderer;
  private graph: SceneGraph;
  private rig: CameraRig;
  private loop: RenderLoop;
  private input: InputController;
  private overlay: DebugOverlay | null = null;
  private assets: AnatomyAssetManager;
  private hotspots = new HotspotLayer();
  private materialLibrary: MaterialLibrary;
  private post: PostStack;
  private mode: ViewMode = "tissu";
  private currentAccent = "#c99277";

  private container: HTMLElement;
  private callbacks: ViewerCallbacks;
  private quality: QualitySettings;
  private detected: QualityProfile;
  private overridden: boolean;

  private organ: LoadedOrgan | null = null;
  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  /** N'écrit que la profondeur — résout un organe en fondu à une seule surface. */
  private depthMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
  });
  private crossSection = false;
  private isolated = false;

  private width = 1;
  private height = 1;
  private resizeObserver: ResizeObserver;
  private loadRequest = 0;
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private hoverProbe: { x: number; y: number } | null = null;
  private calloutEl: HTMLElement | null = null;
  private fadeTween: gsap.core.Tween | null = null;
  private disposed = false;

  /**
   * Le moteur se construit de façon asynchrone parce que WebGPU exige un
   * `await renderer.init()` avant toute autre chose. Le constructeur reste privé
   * pour qu'aucun appelant ne puisse obtenir un viewer à moitié initialisé.
   */
  static async create(container: HTMLElement, callbacks: ViewerCallbacks) {
    const signals = readSignals();
    const { settings, detected, override } = resolveQuality(signals);
    const renderer = await createRenderer({ quality: settings });
    return new AnatomyViewer(
      container,
      callbacks,
      renderer,
      settings,
      detected,
      override !== null,
      {
        reducedMotion: signals.reducedMotion,
        memoryBudget: memoryBudgetBytes(signals.deviceMemory, signals.coarsePointer),
      },
    );
  }

  private constructor(
    container: HTMLElement,
    callbacks: ViewerCallbacks,
    renderer: AnatomyRenderer,
    quality: QualitySettings,
    detected: QualityProfile,
    overridden: boolean,
    options: { reducedMotion: boolean; memoryBudget: number },
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.renderer = renderer;
    this.quality = quality;
    this.detected = detected;
    this.overridden = overridden;

    const canvas = renderer.domElement;
    canvas.setAttribute(
      "aria-label",
      "Modèle d'anatomie 3D interactif. Faites glisser pour tourner, molette pour zoomer, " +
        "flèches haut et bas pour parcourir les points d'intérêt, Entrée pour ouvrir la fiche.",
    );
    canvas.tabIndex = 0;
    container.appendChild(canvas);

    this.applyPixelRatio();

    this.graph = new SceneGraph(renderer, quality);
    this.loop = new RenderLoop(container, {
      update: (delta, now) => this.update(delta, now),
      render: () => this.draw(),
    });
    this.rig = new CameraRig(
      canvas,
      { markDirty: () => this.loop.markDirty(), busy: (s) => this.loop.busy(s) },
      options.reducedMotion,
    );
    this.input = new InputController(canvas, {
      onHover: (x, y) => {
        this.hoverProbe = { x, y };
        this.loop.markDirty();
      },
      onHoverEnd: () => {
        this.hoverProbe = null;
        if (this.hoveredId) {
          this.hoveredId = null;
          this.loop.markDirty();
        }
      },
      onPick: (x, y) => {
        const marker = this.hotspots.pick(x, y, this.rig.camera, this.width, this.height);
        this.select(marker && marker.hotspot.id !== this.selectedId ? marker.hotspot.id : null);
      },
      onAction: (action) => this.handleAction(action),
    });

    this.assets = new AnatomyAssetManager(renderer, options.memoryBudget);
    this.materialLibrary = new MaterialLibrary(renderer.backend, quality.profile);
    this.post = new PostStack(renderer, this.graph.scene, this.rig.camera, quality, {
      width: Math.max(container.clientWidth, 1),
      height: Math.max(container.clientHeight, 1),
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    if (debugRequested()) {
      this.overlay = new DebugOverlay(container, renderer, this.loop, this.quality);
      const post = this.post.status;
      this.overlay.setPasses(post.available ? post.passes.join(" › ") : `off (${post.reason})`);
    }

    callbacks.onReady?.(this.status);
  }

  get status(): EngineStatus {
    return {
      backend: this.renderer.backend,
      quality: this.quality.profile,
      detected: this.detected,
      overridden: this.overridden,
      mode: this.mode,
      post: this.post.status,
    };
  }

  /**
   * Bascule tissu / rayon-X / fantôme.
   *
   * La bascule ne recharge rien : les matériaux d'origine sont conservés et
   * restaurés, ce qui rend l'aller-retour instantané même sur un téléphone.
   */
  setViewMode(mode: ViewMode) {
    if (!this.organ) return this.mode;
    this.mode = this.materialLibrary.setMode(this.organ.meshes, mode);
    // Un changement de matériau invalide les plans de coupe posés sur l'ancien.
    if (this.crossSection) this.applyClipping(true);
    this.loop.markDirty();
    this.callbacks.onReady?.(this.status);
    return this.mode;
  }

  /**
   * Change de profil à chaud. Le pixel ratio — de loin le premier poste de coût —
   * s'applique immédiatement ; l'anti-aliasing et la taille de la sonde
   * d'environnement sont figés à la création du contexte et ne prendront effet
   * qu'au prochain chargement de page. Le choix est persisté dans tous les cas.
   */
  setQuality(profile: QualityProfile | null) {
    this.overridden = profile !== null;
    writeQualityOverride(profile);
    this.quality = qualitySettings(profile ?? this.detected);
    this.applyPixelRatio();
    this.materialLibrary.setProfile(this.quality.profile);
    this.overlay?.setQuality(this.quality);
    this.loop.markDirty();
    this.callbacks.onReady?.(this.status);
    return this.status;
  }

  /**
   * Décidé une fois, jamais adapté en vol. Un contrôleur dynamique a vécu ici et
   * c'était un recul net : les intervalles de frame sont quantifiés par le vsync,
   * donc le moindre à-coup se lisait comme une charge GPU, faisait chuter le
   * buffer, et — un 16,7 ms verrouillé au vsync n'atteignant jamais le seuil de
   * remontée — ne remontait plus jamais. La scène rend en ~2 ms : il n'y a rien
   * à fuir.
   */
  private applyPixelRatio() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality.maxPixelRatio));
  }

  // ---------------------------------------------------------------- organes

  prefetch(url: string) {
    this.assets.prefetch(url, PREVIEW_LEVEL);
  }

  /** Niveau visé ici et maintenant : plancher du profil, affiné par la distance. */
  private targetLevel(): LodLevel {
    const distance = this.rig.camera.position.distanceTo(this.rig.controls.target);
    return selectLevel(this.quality.lodBias, distance);
  }

  async setOrgan(modelUrl: string, hotspots: Hotspot[], accent: string) {
    const request = ++this.loadRequest;
    this.select(null);
    this.callbacks.onLoading(true, 0);

    const outgoing = this.organ;
    if (outgoing) {
      // Changer d'organe en plein fondu laisserait le tween en cours et les proxys
      // de profondeur accrochés à un organe déjà libéré.
      this.fadeTween?.kill();
      this.fadeTween = null;
      this.setDepthPrepass(outgoing, false);
      this.hotspots.clear();
      this.loop.busy(0.8);
      await gsap.to(outgoing.pivot.scale, {
        x: 0.72,
        y: 0.72,
        z: 0.72,
        duration: 0.34,
        ease: "power2.in",
        onUpdate: () => this.loop.markDirty(),
      });
      this.assets.release(outgoing);
      this.organ = null;
      this.loop.markDirty();
    }

    this.rig.tween(this.rig.camera.position, { z: 9.2, duration: 0.42, ease: "power2.inOut" });

    const target = this.targetLevel();
    // Streaming progressif : le niveau le plus léger (~150 Ko) part d'abord et
    // porte toute l'animation d'entrée. Sur une 3G nigérienne c'est la différence
    // entre un organe à l'écran en une seconde et un canevas vide pendant dix.
    const preview: LodLevel = target === PREVIEW_LEVEL ? target : PREVIEW_LEVEL;

    let organ: LoadedOrgan;
    try {
      organ = await this.assets.load(modelUrl, {
        level: preview,
        onProgress: (progress) => {
          if (request === this.loadRequest) this.callbacks.onLoading(true, progress);
        },
      });
    } catch (error) {
      if (request === this.loadRequest) this.callbacks.onLoading(false, 0);
      throw error;
    }
    if (request !== this.loadRequest || this.disposed) return;

    this.organ = organ;
    organ.pivot.scale.setScalar(1);
    organ.pivot.position.set(0, 0, 0);
    this.graph.scene.add(organ.pivot);
    organ.pivot.updateWorldMatrix(true, true);

    this.currentAccent = accent;
    this.dressOrgan(organ, accent);
    if (this.crossSection) this.applyClipping(true);
    this.graph.setAccent(accent);

    // Les points ne sont ancrés que sur le niveau définitif : les accrocher au
    // maillage d'aperçu les ferait sauter de quelques millimètres au raffinement.
    if (preview === target) this.attachHotspots(organ, hotspots);

    organ.pivot.scale.setScalar(0.58);
    organ.pivot.position.z = -1.3;
    this.loop.busy(1.4);
    this.fade(organ, 1, 0.72);
    // L'organe est à l'écran à partir d'ici : le chargement est terminé du point de
    // vue de l'interface. L'animation d'entrée doit se jouer à découvert, pas
    // derrière un panneau de chargement.
    this.callbacks.onLoading(false, 1);
    this.overlay?.rebaseline();
    gsap
      .timeline({ onUpdate: () => this.loop.markDirty() })
      .to(organ.pivot.scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: "back.out(1.25)" }, 0)
      .to(organ.pivot.position, { z: 0, duration: 0.85, ease: "power3.out" }, 0)
      .to(this.rig.camera.position, { z: 8.2, duration: 0.9, ease: "power2.out" }, 0.08);

    if (preview !== target) void this.refine(modelUrl, hotspots, target, request);
  }

  /** Applique les matériaux signature et repose le mode de vue courant. */
  private dressOrgan(organ: LoadedOrgan, accent: string = this.currentAccent) {
    this.materialLibrary.reset();
    this.materialLibrary.enhance(organ.meshes, accent);
    if (this.mode !== "tissu") this.materialLibrary.setMode(organ.meshes, this.mode);
  }

  private attachHotspots(organ: LoadedOrgan, hotspots: Hotspot[]) {
    this.hotspots.attach(organ.pivot, hotspots, organ.meshes);
    this.hotspots.setPixelSize(DOT_PIXELS, this.height, CAMERA_FOV);
  }

  /**
   * Charge le niveau définitif en arrière-plan et le substitue à l'aperçu.
   *
   * La substitution est instantanée et non animée : les deux maillages partagent
   * la même silhouette à quelques dixièmes de millimètre près, un fondu y serait
   * plus visible que la bascule elle-même. La rotation en cours est reprise telle
   * quelle, sans quoi l'organe se remettrait droit sous les doigts de l'étudiant.
   */
  private async refine(modelUrl: string, hotspots: Hotspot[], level: LodLevel, request: number) {
    let detailed: LoadedOrgan;
    try {
      detailed = await this.assets.load(modelUrl, { level });
    } catch {
      // Le raffinement est un bonus : s'il échoue, l'aperçu reste à l'écran et
      // l'étudiant garde un organe utilisable. Aucun message, aucune interruption.
      return;
    }
    if (request !== this.loadRequest || this.disposed) return;

    const preview = this.organ;
    detailed.pivot.rotation.copy(preview?.pivot.rotation ?? detailed.pivot.rotation);
    detailed.pivot.scale.copy(preview?.pivot.scale ?? detailed.pivot.scale);
    detailed.pivot.position.copy(preview?.pivot.position ?? detailed.pivot.position);

    this.hotspots.clear();
    if (preview) this.assets.release(preview);
    this.organ = detailed;
    this.graph.scene.add(detailed.pivot);
    detailed.pivot.updateWorldMatrix(true, true);
    this.dressOrgan(detailed);
    this.attachHotspots(detailed, hotspots);
    if (this.crossSection) this.applyClipping(true);
    this.overlay?.rebaseline();
    this.loop.markDirty();
  }

  private materials(organ: LoadedOrgan) {
    const list: THREE.Material[] = [];
    organ.meshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => list.includes(material) || list.push(material));
    });
    return list;
  }

  /**
   * Fait apparaître un organe en fondu. L'écriture de profondeur reste ACTIVE :
   * ce sont des maillages pleins et fermés, et les laisser se mélanger dans
   * l'ordre de dessin plutôt que dans l'ordre de profondeur fait apparaître la
   * face arrière et l'intérieur à travers l'avant pendant toute la durée du
   * fondu. Un pré-passage de profondeur rend le résultat identique à la passe
   * opaque : seule la surface la plus proche est jamais ombrée.
   */
  private fade(organ: LoadedOrgan, to: number, duration: number) {
    const materials = this.materials(organ);
    const state = { value: to >= 1 ? 0 : 1 };
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = state.value;
      material.depthWrite = true;
    });
    this.setDepthPrepass(organ, true);
    this.loop.busy(duration + 0.1);
    this.fadeTween = gsap.to(state, {
      value: to,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        materials.forEach((material) => (material.opacity = state.value));
        this.loop.markDirty();
      },
      onComplete: () => {
        if (to >= 1) {
          materials.forEach((material) => {
            material.transparent = false;
            material.opacity = 1;
            material.depthWrite = true;
          });
        }
        this.setDepthPrepass(organ, false);
        this.fadeTween = null;
        this.loop.markDirty();
      },
    });
  }

  /**
   * Pose la profondeur de l'organe avant qu'il ne soit ombré, pour qu'un maillage
   * partiellement transparent se résolve quand même à une seule surface par pixel.
   * Le proxy est parenté au maillage qu'il double, donc il hérite gratuitement de
   * l'animation d'entrée. Opaque, donc dessiné avant tout ce qui est transparent.
   * Vivant seulement pendant un fondu : il coûte une passe de profondeur sur
   * ~120 000 triangles.
   */
  private setDepthPrepass(organ: LoadedOrgan, enabled: boolean) {
    organ.meshes.forEach((mesh) => {
      const existing = mesh.children.find((child) => child.name === DEPTH_PREPASS);
      if (!enabled) {
        existing?.removeFromParent();
        return;
      }
      if (existing) return;
      const proxy = new THREE.Mesh(mesh.geometry, this.depthMaterial);
      proxy.name = DEPTH_PREPASS;
      proxy.frustumCulled = mesh.frustumCulled;
      mesh.add(proxy);
    });
  }

  // ---------------------------------------------------------------- boucle

  /** Phase de mise à jour : appelée à chaque rAF, même sans dessin. */
  private update(delta: number, now: number) {
    let changed = this.rig.update(delta, now);
    if (this.assets.hasAnimation) {
      this.assets.update(delta);
      changed = true;
    }
    if (this.hoverProbe && this.resolveHover()) changed = true;
    return changed;
  }

  /** Phase de dessin : n'est appelée que si une frame est nécessaire. */
  private draw() {
    const settled = this.hotspots.update(
      this.rig.camera,
      Math.min(1 / 60, 0.05),
      this.selectedId,
      this.hoveredId,
    );
    // Les points sont encore en train de s'atténuer : il faudra une frame de plus.
    if (!settled) this.loop.markDirty();
    this.positionCallout();
    // La pile de post-processing rend elle-même quand elle est active ; sinon on
    // retombe sur le rendu direct. Jamais les deux, jamais aucun.
    if (!this.post.render(1 / 60)) this.renderer.render(this.graph.scene, this.rig.camera);
  }

  private resize() {
    this.width = Math.max(this.container.clientWidth, 1);
    this.height = Math.max(this.container.clientHeight, 1);
    this.rig.resize(this.width / this.height);
    this.renderer.setSize(this.width, this.height, false);
    this.post.setSize(this.width, this.height);
    this.hotspots.setPixelSize(DOT_PIXELS, this.height, CAMERA_FOV);
    this.loop.markDirty();
  }

  // ---------------------------------------------------------------- entrées

  private resolveHover() {
    const probe = this.hoverProbe;
    this.hoverProbe = null;
    if (!probe) return false;
    const marker = this.hotspots.pick(probe.x, probe.y, this.rig.camera, this.width, this.height);
    const id = marker?.hotspot.id ?? null;
    if (id === this.hoveredId) return false;
    this.hoveredId = id;
    this.renderer.domElement.style.cursor = id ? "pointer" : "";
    return true;
  }

  private handleAction(action: InputAction) {
    const pivot = this.organ?.pivot;
    switch (action) {
      case "rotate-left":
        if (pivot) pivot.rotation.y -= 0.08;
        break;
      case "rotate-right":
        if (pivot) pivot.rotation.y += 0.08;
        break;
      case "zoom-in":
        this.rig.dolly(-1);
        break;
      case "zoom-out":
        this.rig.dolly(1);
        break;
      case "next-hotspot":
      case "previous-hotspot": {
        const next = this.hotspots.step(this.selectedId, action === "next-hotspot" ? 1 : -1);
        if (next) this.select(next.id);
        break;
      }
      case "activate":
        // Ouvrir une fiche au clavier doit aussi amener la caméra : sans ça, le
        // point sélectionné peut rester derrière l'organe et l'annonce vocale
        // décrit quelque chose d'invisible.
        if (this.selectedId) this.focusSelected();
        break;
      case "home":
        this.reset();
        break;
      case "escape":
        this.select(null);
        break;
    }
    this.loop.markDirty();
  }

  private focusSelected() {
    if (!this.selectedId) return;
    const point = this.hotspots.worldPosition(this.selectedId);
    if (point) this.rig.focusOn(point);
  }

  private select(id: string | null) {
    if (this.selectedId === id) return;
    this.selectedId = id;
    // Une sélection ouverte fige l'auto-rotation : lire une fiche pendant que la
    // cible s'éloigne est intenable.
    this.rig.holdAutoRotate(id !== null);
    this.loop.busy(0.4);
    const marker = this.hotspots.list.find((item) => item.hotspot.id === id);
    this.callbacks.onSelect(marker?.hotspot ?? null);
  }

  clearSelection() {
    this.select(null);
  }

  /** La bulle est positionnée impérativement : suivre un modèle qui tourne ne
   *  déclenche ainsi jamais de rendu React. */
  attachCallout(element: HTMLElement | null) {
    this.calloutEl = element;
    this.positionCallout();
    this.loop.markDirty();
  }

  private positionCallout() {
    if (!this.calloutEl || !this.selectedId) return;
    const point = this.hotspots.screenPosition(
      this.selectedId,
      this.rig.camera,
      this.width,
      this.height,
    );
    if (!point) return;
    this.calloutEl.style.transform = `translate3d(${Math.round(point.x)}px, ${Math.round(point.y)}px, 0)`;
    this.calloutEl.dataset.side = point.x > this.width * 0.6 ? "left" : "right";
    this.calloutEl.dataset.behind = point.opacity < 0.3 ? "true" : "false";
  }

  // ---------------------------------------------------------------- outils

  setAutoRotate(enabled: boolean) {
    this.rig.setAutoRotate(enabled);
  }

  orbitTo(preset: CameraPreset) {
    this.rig.orbitTo(preset);
  }

  reset() {
    this.select(null);
    this.rig.frameOrgan();
    if (this.organ)
      this.rig.tween(this.organ.pivot.rotation, {
        x: 0.05,
        y: -0.28,
        z: 0,
        duration: 0.8,
        ease: "power3.out",
      });
  }

  zoom(direction: 1 | -1) {
    this.rig.dolly(direction);
  }

  toggleIsolate() {
    this.isolated = !this.isolated;
    const plinth = this.graph.plinth.material;
    plinth.transparent = true;
    this.rig.tween(plinth, { opacity: this.isolated ? 0.15 : 1, duration: 0.45 });
    this.rig.tween(this.graph.contactShadow.material, {
      opacity: this.isolated ? 0.08 : 0.55,
      duration: 0.45,
    });
    return this.isolated;
  }

  toggleCrossSection() {
    this.crossSection = !this.crossSection;
    this.applyClipping(this.crossSection);
    gsap.fromTo(
      this.clipPlane,
      { constant: -1.8 },
      {
        constant: this.crossSection ? 0 : -1.8,
        duration: 0.85,
        ease: "power2.inOut",
        onUpdate: () => this.loop.markDirty(),
      },
    );
    this.loop.busy(0.95);
    return this.crossSection;
  }

  private applyClipping(enabled: boolean) {
    if (!this.organ) return;
    const planes = enabled ? [this.clipPlane] : null;
    [...this.materials(this.organ), this.depthMaterial].forEach((material) => {
      material.clippingPlanes = planes;
      material.needsUpdate = true;
    });
    this.loop.markDirty();
  }

  toggleLayers() {
    if (!this.organ) return false;
    let enabled = false;
    this.materials(this.organ).forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.wireframe = !material.wireframe;
        enabled = material.wireframe;
      }
    });
    this.loop.markDirty();
    return enabled;
  }

  dispose() {
    this.disposed = true;
    this.loadRequest += 1;
    this.loop.dispose();
    this.rig.dispose();
    this.input.dispose();
    this.overlay?.dispose();
    this.resizeObserver.disconnect();
    this.hotspots.dispose();
    this.post.dispose();
    this.materialLibrary.dispose();
    this.depthMaterial.dispose();
    this.assets.dispose();
    this.graph.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
