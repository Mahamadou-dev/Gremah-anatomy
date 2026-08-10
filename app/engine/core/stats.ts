import type { AnatomyRenderer } from "./renderer";
import type { RenderLoop } from "./render-loop";
import type { QualitySettings } from "./capabilities";

/**
 * Overlay de mesure, activé par `?debug=1`.
 *
 * Sans lui, les sprints suivants (matériaux, physiologie) optimisent à l'aveugle :
 * on ne peut pas tenir un budget de 8 ms par frame qu'on ne mesure pas. Il est en
 * DOM pur et hors React — l'afficher ne doit rien coûter au rendu.
 */

export function debugRequested() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

const REFRESH_MS = 250;

export class DebugOverlay {
  private element: HTMLDivElement;
  private renderer: AnatomyRenderer;
  private loop: RenderLoop;
  private quality: QualitySettings;
  private timer: number;
  /** Relevé pris au démarrage : sert de référence pour repérer une fuite GPU. */
  private baseline: { geometries: number; textures: number };

  constructor(
    container: HTMLElement,
    renderer: AnatomyRenderer,
    loop: RenderLoop,
    quality: QualitySettings,
  ) {
    this.renderer = renderer;
    this.loop = loop;
    this.quality = quality;
    this.baseline = { ...renderer.info.memory };

    this.element = document.createElement("div");
    this.element.className = "engine-debug";
    this.element.setAttribute("aria-hidden", "true");
    container.appendChild(this.element);

    this.timer = window.setInterval(this.refresh, REFRESH_MS);
    this.refresh();
  }

  setQuality(quality: QualitySettings) {
    this.quality = quality;
  }

  /** Rebase le relevé mémoire après un changement d'organe volontaire. */
  rebaseline() {
    this.baseline = { ...this.renderer.info.memory };
  }

  private refresh = () => {
    const { fps, cpuMs, drawn, ticks } = this.loop.metrics;
    const { memory, render } = this.renderer.info;
    const leakedGeometries = memory.geometries - this.baseline.geometries;
    const leakedTextures = memory.textures - this.baseline.textures;
    const overBudget = cpuMs > this.quality.frameBudgetMs;

    this.element.innerHTML = [
      row("backend", this.renderer.backend),
      row("profil", this.quality.profile),
      row("fps", fps.toFixed(0)),
      row("cpu", `${cpuMs.toFixed(2)} ms / ${this.quality.frameBudgetMs} ms`, overBudget),
      row("draw calls", String(render.calls)),
      row("triangles", render.triangles.toLocaleString("fr-FR")),
      row("géométries", delta(memory.geometries, leakedGeometries), leakedGeometries > 0),
      row("textures", delta(memory.textures, leakedTextures), leakedTextures > 0),
      // L'écart entre rAF reçus et frames dessinées est la mesure directe de ce
      // que le render-on-demand fait économiser à la batterie.
      row("frames", `${drawn} / ${ticks} rAF`),
    ].join("");
  };

  dispose() {
    window.clearInterval(this.timer);
    this.element.remove();
  }
}

function delta(value: number, drift: number) {
  return drift === 0 ? String(value) : `${value} (${drift > 0 ? "+" : ""}${drift})`;
}

function row(label: string, value: string, warn = false) {
  return `<span><i>${label}</i><b${warn ? ' class="warn"' : ""}>${value}</b></span>`;
}
