"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  CircleDashed,
  Layers3,
  Maximize2,
  RotateCcw,
  ScanLine,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { Hotspot, Organ } from "../content/organes";
import type { AnatomyViewer, EngineStatus } from "../engine/viewer";
import { QUALITY_PROFILES, type QualityProfile } from "../engine/core/capabilities";
import { VIEW_MODES, type ViewMode } from "../engine/materials/params";

type Props = {
  organ: Organ;
  autoRotate: boolean;
  onAutoRotate: (enabled: boolean) => void;
  compare: boolean;
  onCompare: () => void;
};

const BACKEND_LABEL = { webgpu: "WebGPU", webgl2: "WebGL2" } as const;
const QUALITY_LABEL: Record<QualityProfile, string> = {
  low: "Éco",
  medium: "Standard",
  high: "Élevé",
};
const MODE_LABEL: Record<ViewMode, string> = {
  tissu: "Tissu",
  "rayon-x": "Rayon X",
  fantome: "Fantôme",
};
const MODE_HINT: Record<ViewMode, string> = {
  tissu: "Rendu réaliste des tissus, avec translucidité de surface",
  "rayon-x": "Vue radiographique : les couches profondes deviennent lisibles",
  fantome: "Couche de contexte estompée, pour situer sans masquer",
};

export function OrganViewer({ organ, autoRotate, onAutoRotate, compare, onCompare }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<AnatomyViewer | null>(null);
  const organRef = useRef(organ);
  const autoRotateRef = useRef(autoRotate);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [slowLoad, setSlowLoad] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineStatus | null>(null);

  // A typical organ is ready well inside a second — flashing a loading panel for
  // that reads as jank. It only appears if the fetch is genuinely slow; the flag
  // is cleared by onLoading when the next load starts.
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setSlowLoad(true), 900);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    organRef.current = organ;
  }, [organ]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    let cancelled = false;
    let viewer: AnatomyViewer | null = null;

    // La création est asynchrone parce que WebGPU exige un `init()` : entre
    // l'import et la fin de l'init, le composant peut très bien avoir été démonté.
    void import("../engine/viewer")
      .then(({ AnatomyViewer: Viewer }) => {
        if (cancelled || !mountRef.current) return null;
        return Viewer.create(mountRef.current, {
          onSelect: setSelected,
          onLoading: (isLoading, value) => {
            setLoading(isLoading);
            setProgress(value);
            if (isLoading) setSlowLoad(false);
          },
          onReady: setEngine,
        });
      })
      .then((created) => {
        if (!created) return;
        if (cancelled) {
          created.dispose();
          return;
        }
        viewer = created;
        viewerRef.current = created;
        created.setAutoRotate(autoRotateRef.current);
        const current = organRef.current;
        created.setOrgan(current.model, current.hotspots, current.accent).catch(() => {
          setLoading(false);
          setProgress(0);
        });
      });

    return () => {
      cancelled = true;
      viewerRef.current = null;
      viewer?.dispose();
    };
  }, []);

  useEffect(() => {
    viewerRef.current?.setOrgan(organ.model, organ.hotspots, organ.accent).catch(() => {
      setLoading(false);
      setProgress(0);
    });
  }, [organ]);

  useEffect(() => viewerRef.current?.setAutoRotate(autoRotate), [autoRotate]);

  // The viewer drives the callout's position directly, so a spinning model
  // never costs a React render.
  const calloutRef = useCallback((node: HTMLDivElement | null) => {
    viewerRef.current?.attachCallout(node);
  }, []);

  const handleTool = (tool: string) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (tool === "rotate") onAutoRotate(!autoRotate);
    if (tool === "zoom") viewer.zoom(-1);
    if (tool === "isolate") setActiveTool(viewer.toggleIsolate() ? tool : null);
    if (tool === "section") setActiveTool(viewer.toggleCrossSection() ? tool : null);
    if (tool === "layers") setActiveTool(viewer.toggleLayers() ? tool : null);
    if (tool === "compare") onCompare();
    if (tool === "reset") {
      viewer.reset();
      setActiveTool(null);
    }
  };

  const setQuality = (profile: QualityProfile | null) => {
    const status = viewerRef.current?.setQuality(profile);
    if (status) setEngine(status);
  };

  const setMode = (mode: ViewMode) => {
    viewerRef.current?.setViewMode(mode);
  };

  const tools = [
    { id: "rotate", label: "Rotation", icon: RotateCcw },
    { id: "zoom", label: "Zoom", icon: Search },
    { id: "isolate", label: "Isoler", icon: CircleDashed },
    { id: "section", label: "Coupe", icon: ScanLine },
    { id: "layers", label: "Maillage", icon: Layers3 },
    { id: "compare", label: "Comparer", icon: Box },
    { id: "reset", label: "Recentrer", icon: RotateCcw },
  ];

  return (
    <section className="viewer-shell" aria-label={`Visionneuse 3D : ${organ.name}`}>
      <div
        className="viewer-glow"
        style={{ "--organ-accent": organ.accent } as React.CSSProperties}
      />
      <div ref={mountRef} className="three-mount" />

      <div className="viewer-tools" aria-label="Outils de la visionneuse 3D">
        {tools.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tool-button ${activeTool === id || (id === "compare" && compare) ? "active" : ""}`}
            onClick={() => handleTool(id)}
            aria-pressed={activeTool === id || (id === "compare" && compare)}
            title={label}
          >
            <Icon size={19} strokeWidth={1.65} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <aside className="tip-note" aria-label="Aide à la manipulation">
        <span>
          <Sparkles size={15} /> Astuce
        </span>
        <p>
          Glisser pour tourner
          <br />
          Molette pour zoomer
          <br />
          Cliquer un point pour la fiche
        </p>
      </aside>

      {selected && (
        <div className="hotspot-callout" ref={calloutRef} data-side="right">
          <div
            className="callout-body"
            style={{ "--hotspot-color": selected.color } as React.CSSProperties}
          >
            <button
              className="callout-close"
              type="button"
              onClick={() => viewerRef.current?.clearSelection()}
              aria-label="Fermer"
            >
              <X size={13} />
            </button>
            <b>{selected.label}</b>
            {selected.latin && <i className="callout-latin">{selected.latin}</i>}
            <small>{selected.detail}</small>
          </div>
        </div>
      )}

      {/* Équivalent lecteur d'écran des points, qui vivent dans le canevas. */}
      <ul className="hotspot-index">
        {organ.hotspots.map((hotspot) => (
          <li key={hotspot.id}>
            {hotspot.label} ({hotspot.latin}) : {hotspot.detail}
          </li>
        ))}
      </ul>

      {loading && slowLoad && (
        <div className="model-loader" role="status" aria-live="polite">
          <div className="loader-orbit">
            <Maximize2 size={20} />
          </div>
          <strong>Chargement — {organ.name.toLowerCase()}</strong>
          <span>{Math.max(8, Math.round(progress * 100))} %</span>
        </div>
      )}

      <button
        className="auto-rotate"
        type="button"
        onClick={() => onAutoRotate(!autoRotate)}
        aria-pressed={autoRotate}
      >
        <RotateCcw size={14} /> Rotation auto
        <span className={`switch ${autoRotate ? "on" : ""}`}>
          <i />
        </span>
      </button>

      {engine && (
        <div className="mode-switch" role="group" aria-label="Mode de rendu">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              aria-pressed={engine.mode === mode}
              className={engine.mode === mode ? "on" : ""}
              title={MODE_HINT[mode]}
            >
              {MODE_LABEL[mode]}
            </button>
          ))}
        </div>
      )}

      {engine && (
        <div className="engine-badge">
          <span className="engine-backend" title={`Rendu ${BACKEND_LABEL[engine.backend]}`}>
            {BACKEND_LABEL[engine.backend]}
          </span>
          <div
            className="quality-switch"
            role="group"
            aria-label="Qualité de rendu"
            title="Qualité de rendu — baissez-la si l'affichage saccade"
          >
            {QUALITY_PROFILES.map((profile) => (
              <button
                key={profile}
                type="button"
                onClick={() => setQuality(profile)}
                aria-pressed={engine.quality === profile}
                className={engine.quality === profile ? "on" : ""}
              >
                {QUALITY_LABEL[profile]}
              </button>
            ))}
            {/* Revenir à la détection : sans cette porte de sortie, un mauvais choix
                fait sur un vieux téléphone suit l'étudiant sur tous les autres. */}
            <button
              type="button"
              onClick={() => setQuality(null)}
              aria-pressed={!engine.overridden}
              className={engine.overridden ? "" : "on"}
              title={`Automatique — détecté : ${QUALITY_LABEL[engine.detected]}`}
            >
              Auto
            </button>
          </div>
        </div>
      )}

      <div className="view-caption">
        <span>Spécimen 3D · cliquez un point pour explorer</span>
        <strong>{organ.latin}</strong>
      </div>
    </section>
  );
}
