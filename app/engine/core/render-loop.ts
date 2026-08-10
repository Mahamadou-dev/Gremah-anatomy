import * as THREE from "three";

/**
 * La boucle, et la comptabilité du render-on-demand.
 *
 * Règle du projet : on ne dessine que si quelque chose a bougé. Une animation
 * continue ne s'autorise pas une boucle infinie — elle déclare une durée
 * d'activité via `busy()`. C'est ce qui permet à un téléphone d'entrée de gamme de
 * garder l'organe à l'écran sans vider la batterie.
 */

export type LoopHooks = {
  /**
   * Phase de mise à jour, appelée à chaque frame même quand on ne dessine pas
   * (les contrôles amortis doivent continuer d'être intégrés).
   * Retourne `true` s'il faut redessiner.
   */
  update: (delta: number, now: number) => boolean;
  /** Phase de dessin, appelée seulement si nécessaire. */
  render: () => void;
};

export type LoopMetrics = {
  /** Images réellement dessinées par seconde — pas les rAF reçus. */
  fps: number;
  /** Temps CPU moyen d'une frame dessinée, en millisecondes. */
  cpuMs: number;
  /** Frames dessinées depuis le démarrage. */
  drawn: number;
  /** rAF reçus depuis le démarrage : l'écart avec `drawn` mesure l'économie. */
  ticks: number;
};

export class RenderLoop {
  private hooks: LoopHooks;
  private clock = new THREE.Clock();
  private frame = 0;
  private dirty = true;
  private busyUntil = 0;
  private disposed = false;

  private isVisible = true;
  private isPageVisible = true;
  private intersectionObserver: IntersectionObserver;

  private drawn = 0;
  private ticks = 0;
  private cpuMs = 0;
  private windowStart = 0;
  private windowFrames = 0;
  private fps = 0;

  constructor(container: HTMLElement, hooks: LoopHooks) {
    this.hooks = hooks;
    // Hors écran, on ne dessine rien : l'atlas vit dans une page qui défile.
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) this.markDirty();
      },
      { rootMargin: "120px" },
    );
    this.intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.windowStart = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  markDirty() {
    this.dirty = true;
  }

  /** Garde la boucle vivante pendant `seconds`. Toute animation doit le déclarer. */
  busy(seconds: number) {
    this.busyUntil = Math.max(this.busyUntil, performance.now() + seconds * 1000);
    this.dirty = true;
  }

  get metrics(): LoopMetrics {
    return { fps: this.fps, cpuMs: this.cpuMs, drawn: this.drawn, ticks: this.ticks };
  }

  get active() {
    return this.isVisible && this.isPageVisible;
  }

  private tick = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    if (!this.active) return;

    this.ticks += 1;
    // Un delta plafonné : après un retour d'onglet, l'horloge a pu accumuler
    // plusieurs secondes, et intégrer ça d'un coup fait sauter l'amortissement.
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const now = performance.now();

    const changed = this.hooks.update(delta, now);
    if (changed) this.dirty = true;
    if (now < this.busyUntil) this.dirty = true;
    if (!this.dirty) return;

    const started = performance.now();
    this.hooks.render();
    this.dirty = false;

    // Moyenne glissante : une frame isolée ne dit rien, la tendance si.
    const elapsed = performance.now() - started;
    this.cpuMs = this.cpuMs === 0 ? elapsed : this.cpuMs * 0.9 + elapsed * 0.1;
    this.drawn += 1;
    this.windowFrames += 1;
    if (now - this.windowStart >= 500) {
      this.fps = (this.windowFrames * 1000) / (now - this.windowStart);
      this.windowStart = now;
      this.windowFrames = 0;
    }
  };

  private onVisibilityChange = () => {
    this.isPageVisible = !document.hidden;
    if (this.isPageVisible) {
      this.clock.start();
      this.markDirty();
    }
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }
}
