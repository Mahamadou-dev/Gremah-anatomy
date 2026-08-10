import * as THREE from "three";
import type { QualitySettings } from "./capabilities";

/**
 * Abstraction du renderer : WebGPU si le navigateur le propose, WebGL2 sinon.
 *
 * Tout le reste du moteur programme contre `AnatomyRenderer` et ignore lequel des
 * deux tourne. C'est la condition pour que le Sprint 3 puisse écrire des matériaux
 * TSL sans forker le code applicatif en deux.
 */

export type RenderBackend = "webgpu" | "webgl2";

/** Compteurs exposés par les deux backends, utilisés par l'overlay `?debug=1`. */
export type RendererInfo = {
  memory: { geometries: number; textures: number };
  render: { calls: number; triangles: number };
};

export interface AnatomyRenderer {
  readonly backend: RenderBackend;
  readonly domElement: HTMLCanvasElement;
  /** Anisotropie réellement disponible, déjà bornée par le profil de qualité. */
  readonly maxAnisotropy: number;
  readonly info: RendererInfo;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  setPixelRatio(value: number): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  /**
   * Prépare une texture équirectangulaire pour `scene.environment`.
   * WebGL passe par PMREM ; WebGPU sait consommer l'équirectangulaire tel quel.
   */
  prepareEnvironment(source: THREE.Texture): THREE.Texture;
  dispose(): void;
}

/** Forme minimale commune aux deux renderers de three, sans importer `three/webgpu`. */
type RendererLike = {
  domElement: HTMLCanvasElement;
  info: RendererInfo;
  // Volontairement élargis : `WebGLRenderer` type ces champs en `string` alors que
  // les constantes de three sont des littéraux, et les deux backends ne les
  // déclarent pas identiquement.
  outputColorSpace: string;
  toneMapping: number;
  toneMappingExposure: number;
  localClippingEnabled: boolean;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  setPixelRatio(value: number): void;
  render(scene: THREE.Scene, camera: THREE.Camera): unknown;
  dispose(): void;
};

export type RendererOptions = {
  quality: QualitySettings;
  /** Force un backend — `?renderer=webgl` sert à comparer la parité visuelle. */
  force?: RenderBackend | null;
};

/**
 * Lit la surcharge de backend dans l'URL. Sans elle, vérifier la parité WebGPU /
 * WebGL2 exigerait de changer de navigateur, ce qui rend la comparaison inutilisable.
 */
export function forcedBackend(): RenderBackend | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("renderer");
  if (value === "webgl" || value === "webgl2") return "webgl2";
  if (value === "webgpu") return "webgpu";
  return null;
}

export async function createRenderer({
  quality,
  force = forcedBackend(),
}: RendererOptions): Promise<AnatomyRenderer> {
  if (force !== "webgl2" && (force === "webgpu" || "gpu" in navigator)) {
    const webgpu = await tryWebGPU(quality);
    if (webgpu) return webgpu;
    // Un adaptateur refusé, un pilote sur liste noire, un build sans WebGPU : on
    // retombe en silence. Un écran noir serait le pire des deux mondes.
  }
  return createWebGL(quality);
}

async function tryWebGPU(quality: QualitySettings): Promise<AnatomyRenderer | null> {
  try {
    const { WebGPURenderer } = (await import("three/webgpu")) as unknown as {
      WebGPURenderer: new (params: Record<string, unknown>) => RendererLike & {
        init(): Promise<void>;
      };
    };
    const renderer = new WebGPURenderer({
      antialias: quality.antialias,
      alpha: true,
      powerPreference: "high-performance",
      forceWebGL: false,
    });
    await renderer.init();
    configure(renderer);
    return wrap(renderer, "webgpu", quality, null);
  } catch {
    return null;
  }
}

function createWebGL(quality: QualitySettings): AnatomyRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: quality.antialias,
    alpha: true,
    powerPreference: "high-performance",
    // Le stencil sera nécessaire au capping des coupes (Sprint 4) ; tant qu'il ne
    // sert pas, le buffer est une dépense pure.
    stencil: false,
    depth: true,
  });
  configure(renderer);
  const anisotropy = Math.min(quality.maxAnisotropy, renderer.capabilities.getMaxAnisotropy());
  return wrap(renderer, "webgl2", quality, anisotropy);
}

function configure(renderer: RendererLike) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.localClippingEnabled = true;
}

function wrap(
  renderer: RendererLike,
  backend: RenderBackend,
  quality: QualitySettings,
  anisotropy: number | null,
): AnatomyRenderer {
  return {
    backend,
    domElement: renderer.domElement,
    maxAnisotropy: anisotropy ?? quality.maxAnisotropy,
    get info() {
      return renderer.info;
    },
    setSize: (width, height, updateStyle) => renderer.setSize(width, height, updateStyle),
    setPixelRatio: (value) => renderer.setPixelRatio(value),
    render: (scene, camera) => {
      // WebGPURenderer.render est asynchrone ; on ne l'attend pas, la boucle
      // render-on-demand redemandera une frame si quelque chose a bougé entretemps.
      void renderer.render(scene, camera);
    },
    prepareEnvironment: (source) => {
      if (backend === "webgpu") {
        // Le pipeline de nœuds convertit l'équirectangulaire lui-même ; passer par
        // PMREM ici imposerait d'importer la variante WebGPU du générateur.
        return source;
      }
      const pmrem = new THREE.PMREMGenerator(renderer as unknown as THREE.WebGLRenderer);
      const environment = pmrem.fromEquirectangular(source).texture;
      pmrem.dispose();
      source.dispose();
      return environment;
    },
    dispose: () => renderer.dispose(),
  };
}
