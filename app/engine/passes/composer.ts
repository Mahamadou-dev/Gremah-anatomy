import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { AnatomyRenderer } from "../core/renderer";
import type { QualitySettings } from "../core/capabilities";

/**
 * Pile de post-processing.
 *
 * Deux principes gouvernent ce fichier :
 *
 * 1. **`low` ne paie rien.** Aucune passe, aucune cible de rendu supplémentaire,
 *    aucun octet de VRAM en plus. Le profil de référence est un Android à
 *    150 000 FCFA ; une passe plein écran de plus y coûte des millisecondes qu'on
 *    n'a pas.
 * 2. **Jamais d'écran noir.** Si la pile ne peut pas se construire, on rend en
 *    direct et on le dit dans l'état du moteur, plutôt que d'échouer en silence.
 *
 * La chaîne WebGPU passe par le système de nœuds de three, incompatible avec
 * `EffectComposer`. Elle rend donc en direct pour l'instant — c'est signalé par
 * `available`, affiché dans l'overlay `?debug=1`, et non masqué.
 */

/** `?passes=0` coupe la pile — le premier réflexe quand un rendu est suspect. */
export function passesRequested() {
  if (typeof window === "undefined") return true;
  return new URLSearchParams(window.location.search).get("passes") !== "0";
}

export type PostStatus = {
  /** Vrai si le rendu passe réellement par la pile. */
  available: boolean;
  /** Pourquoi elle est absente, le cas échéant. */
  reason: string | null;
  passes: string[];
};

/**
 * Grain + vignette, en une seule passe.
 *
 * Le grain n'est pas une coquetterie : les dégradés profonds de la charte
 * « huilée » produisent des bandes visibles sur les écrans 6 bits des téléphones
 * d'entrée de gamme, et un bruit d'un demi-niveau les casse. La vignette, elle,
 * ramène l'œil au centre — un organe isolé sur fond sombre a tendance à flotter.
 */
const GrainVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.045 },
    uVignette: { value: 0.9 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Vignette chaude plutôt que noire : la charte interdit les ombres neutres.
      vec2 centred = vUv - 0.5;
      float falloff = smoothstep(0.78, 0.28, length(centred) * uVignette);
      color.rgb = mix(color.rgb * vec3(0.82, 0.74, 0.70), color.rgb, falloff);

      // Bruit blanc décorrélé par frame. Statique, il se lirait comme une texture
      // sale collée à l'écran.
      float noise = fract(sin(dot(vUv * (1.0 + uTime), vec2(12.9898, 78.233))) * 43758.5453);
      color.rgb += (noise - 0.5) * uGrain;

      gl_FragColor = color;
    }
  `,
};

export class PostStack {
  private composer: EffectComposer | null = null;
  private grain: ShaderPass | null = null;
  private bloom: UnrealBloomPass | null = null;
  private statusValue: PostStatus;
  private elapsed = 0;

  constructor(
    renderer: AnatomyRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    quality: QualitySettings,
    size: { width: number; height: number },
  ) {
    const passes: string[] = [];

    if (!passesRequested()) {
      this.statusValue = { available: false, reason: "désactivé par ?passes=0", passes };
      return;
    }
    if (quality.profile === "low") {
      this.statusValue = { available: false, reason: "profil éco", passes };
      return;
    }
    if (renderer.backend !== "webgl2") {
      this.statusValue = { available: false, reason: "pile WebGPU à venir", passes };
      return;
    }

    try {
      const gl = renderer.raw as THREE.WebGLRenderer;
      this.composer = new EffectComposer(gl);
      this.composer.setSize(size.width, size.height);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, quality.maxPixelRatio));
      this.composer.addPass(new RenderPass(scene, camera));
      passes.push("render");

      if (quality.passes.bloom) {
        // Bloom par seuil plutôt que par masque de calque : les seuls éléments de
        // la scène au-dessus de 0,9 sont les points d'intérêt, rendus sans tone
        // mapping. Le résultat est identique à un bloom sélectif, sans la seconde
        // passe de rendu qu'un masque imposerait.
        this.bloom = new UnrealBloomPass(
          new THREE.Vector2(size.width, size.height),
          quality.profile === "high" ? 0.42 : 0.3,
          0.62,
          0.9,
        );
        this.composer.addPass(this.bloom);
        passes.push("bloom");
      }

      this.grain = new ShaderPass(GrainVignetteShader);
      this.grain.uniforms.uGrain.value = quality.profile === "high" ? 0.04 : 0.03;
      this.composer.addPass(this.grain);
      passes.push("grain+vignette");

      // Tone mapping et conversion d'espace colorimétrique en dernier, une seule
      // fois : les appliquer plus tôt ferait travailler les passes sur des valeurs
      // déjà écrasées.
      this.composer.addPass(new OutputPass());
      passes.push("output");

      this.statusValue = { available: true, reason: null, passes };
    } catch (error) {
      this.composer = null;
      this.statusValue = {
        available: false,
        reason: error instanceof Error ? error.message : "construction impossible",
        passes: [],
      };
    }
  }

  get status(): PostStatus {
    return this.statusValue;
  }

  setSize(width: number, height: number) {
    this.composer?.setSize(width, height);
    this.bloom?.setSize(width, height);
  }

  /** Retourne `true` si la pile a rendu ; sinon l'appelant rend en direct. */
  render(delta: number) {
    if (!this.composer) return false;
    this.elapsed += delta;
    if (this.grain) this.grain.uniforms.uTime.value = this.elapsed;
    this.composer.render(delta);
    return true;
  }

  dispose() {
    this.composer?.dispose();
    this.bloom?.dispose();
    this.composer = null;
  }
}
