import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";

/**
 * Caméra et ses cinématiques.
 *
 * Toutes les transitions passent par ici pour une raison : chacune doit déclarer
 * sa durée d'activité à la boucle (`busy`), sinon le render-on-demand s'arrête au
 * milieu d'un mouvement et l'image se fige.
 */

export const CAMERA_FOV = 34;
export const MIN_DISTANCE = 4.8;
export const MAX_DISTANCE = 12;

/** Légèrement au-dessus du niveau des yeux : le socle se lit comme un disque sur
 *  lequel l'organe repose, et non comme une bande vue par la tranche. */
const HOME_POSITION = { x: 0, y: 1.05, z: 8.2 };
const HOME_TARGET = { x: 0, y: 0.02, z: 0 };

export type CameraPreset = "face" | "dos" | "gauche" | "droite" | "dessus";

/** Vues normalisées : les mêmes angles pour tous les organes, donc comparables. */
const PRESETS: Record<CameraPreset, THREE.Vector3Like> = {
  face: { x: 0, y: 1.05, z: 8.2 },
  dos: { x: 0, y: 1.05, z: -8.2 },
  gauche: { x: -8.2, y: 1.05, z: 0 },
  droite: { x: 8.2, y: 1.05, z: 0 },
  dessus: { x: 0, y: 8.2, z: 0.6 },
};

export type RigHooks = {
  /** Marque la scène sale pour la frame courante. */
  markDirty: () => void;
  /** Garde la boucle active pendant `seconds`, le temps d'une animation. */
  busy: (seconds: number) => void;
};

export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
  readonly controls: OrbitControls;

  private hooks: RigHooks;
  private autoRotateWanted = true;
  private interactionUntil = 0;
  private suspendAutoRotate = false;
  private reducedMotion: boolean;

  constructor(domElement: HTMLElement, hooks: RigHooks, reducedMotion: boolean) {
    this.hooks = hooks;
    this.reducedMotion = reducedMotion;

    this.camera.position.set(HOME_POSITION.x, HOME_POSITION.y, HOME_POSITION.z);
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.minDistance = MIN_DISTANCE;
    this.controls.maxDistance = MAX_DISTANCE;
    // `prefers-reduced-motion` coupe l'auto-rotation : c'est le mouvement continu
    // non sollicité qui gêne, pas les transitions déclenchées par l'utilisateur.
    this.controls.autoRotate = !reducedMotion;
    this.controls.autoRotateSpeed = 0.65;
    this.controls.target.set(HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z);
    this.controls.addEventListener("start", this.onInteract);
  }

  /** Vrai si quelque chose a bougé et qu'il faut redessiner. */
  update(delta: number, now: number) {
    this.controls.autoRotate =
      this.autoRotateWanted &&
      !this.reducedMotion &&
      !this.suspendAutoRotate &&
      now >= this.interactionUntil;
    return this.controls.update(delta);
  }

  resize(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotateWanted = enabled;
    if (enabled) this.interactionUntil = 0;
    this.hooks.markDirty();
  }

  /** Suspend l'auto-rotation sans oublier le choix de l'utilisateur (sélection active). */
  holdAutoRotate(hold: boolean) {
    this.suspendAutoRotate = hold;
    this.hooks.markDirty();
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    this.hooks.markDirty();
  }

  /** Cadre l'organe entier : le retour à la vue de référence. */
  frameOrgan(duration = 0.8) {
    this.tween(this.camera.position, { ...HOME_POSITION, duration, ease: "power3.out" });
    this.tween(this.controls.target, { ...HOME_TARGET, duration, ease: "power3.out" });
  }

  /** Bascule vers un angle normalisé en conservant la distance courante. */
  orbitTo(preset: CameraPreset, duration = 0.9) {
    const target = PRESETS[preset];
    const distance = this.camera.position.distanceTo(this.controls.target);
    const direction = new THREE.Vector3(target.x, target.y, target.z).normalize();
    const destination = direction.multiplyScalar(
      THREE.MathUtils.clamp(distance, MIN_DISTANCE, MAX_DISTANCE),
    );
    this.tween(this.camera.position, {
      x: destination.x,
      y: destination.y,
      z: destination.z,
      duration,
      ease: "power3.inOut",
    });
    this.tween(this.controls.target, { ...HOME_TARGET, duration, ease: "power3.inOut" });
  }

  /**
   * Amène la caméra sur un point d'intérêt : la cible glisse vers le point et la
   * caméra se rapproche le long de l'axe courant, sans jamais franchir la distance
   * minimale — plonger dans le maillage désoriente plus que ça n'informe.
   */
  focusOn(point: THREE.Vector3, duration = 0.9) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(offset.length() * 0.72, MIN_DISTANCE, MAX_DISTANCE);
    const destination = point.clone().add(offset.setLength(distance));
    this.tween(this.camera.position, {
      x: destination.x,
      y: destination.y,
      z: destination.z,
      duration,
      ease: "power3.out",
    });
    this.tween(this.controls.target, {
      x: point.x,
      y: point.y,
      z: point.z,
      duration,
      ease: "power3.out",
    });
  }

  dolly(direction: 1 | -1, duration = 0.5) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const length = THREE.MathUtils.clamp(
      offset.length() + direction * 1.2,
      MIN_DISTANCE,
      MAX_DISTANCE,
    );
    const destination = this.controls.target.clone().add(offset.setLength(length));
    this.tween(this.camera.position, {
      x: destination.x,
      y: destination.y,
      z: destination.z,
      duration,
      ease: "power2.out",
    });
  }

  /** Toute animation de caméra passe par là, donc déclare toujours sa durée. */
  tween(target: object, vars: gsap.TweenVars) {
    const duration = (vars.duration as number) ?? 0.5;
    this.hooks.busy(duration + 0.1);
    return gsap.to(target, { ...vars, onUpdate: () => this.hooks.markDirty() });
  }

  private onInteract = () => {
    // Reprendre la rotation immédiatement après un geste donnerait l'impression
    // que la scène résiste ; trois secondes suffisent à ne pas se battre avec elle.
    this.interactionUntil = performance.now() + 3000;
    this.hooks.markDirty();
  };

  dispose() {
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);
    this.controls.removeEventListener("start", this.onInteract);
    this.controls.dispose();
  }
}
