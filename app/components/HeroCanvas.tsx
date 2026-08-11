"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_ORGANS, HeroScene, type HeroOrgan } from "../engine/scenes/hero";

/**
 * Pont React ↔ `HeroScene`. Seul endroit de l'accueil autorisé à connaître le
 * moteur (CLAUDE.md §4) : il possède le cycle de vie create → update → dispose
 * et n'expose au reste de l'UI que des valeurs sérialisables.
 */
export function HeroCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HeroScene | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<HeroOrgan>(HERO_ORGANS[0]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new HeroScene(host, {
      onReady: () => setReady(true),
      onOrganChange: (organ) => setActive(organ),
      onFailure: () => setFailed(true),
    });
    sceneRef.current = scene;
    void scene.start();

    const onPointerMove = (event: PointerEvent) => {
      // Parallaxe relative à la fenêtre et non au canvas : le héros continue de
      // réagir quand le curseur passe sur le texte posé par-dessus.
      scene.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
    };
    const onScroll = () => {
      const rect = host.getBoundingClientRect();
      scene.setScroll(rect.height > 0 ? -rect.top / rect.height : 0);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="hero-canvas" data-ready={ready} data-failed={failed}>
      <div ref={hostRef} className="hero-canvas-host" aria-hidden={failed} />

      {/* Le poster n'est pas un simple écran d'attente : c'est le repli complet
          quand aucun contexte GPU n'est disponible. Il porte donc le halo et la
          silhouette, pour qu'un appareil sans WebGL voie encore une composition. */}
      <div className="hero-poster" aria-hidden={ready && !failed}>
        <span className="hero-poster-halo" />
        <span className="hero-poster-label">
          {failed ? "Aperçu 3D indisponible sur cet appareil" : "Préparation de la scène…"}
        </span>
      </div>

      {!failed && (
        <div className="hero-organ-switch" role="group" aria-label="Organe présenté">
          {HERO_ORGANS.map((organ, index) => (
            <button
              key={organ.id}
              type="button"
              className="hero-organ-chip"
              aria-pressed={organ.id === active.id}
              style={{ "--chip-accent": organ.accent } as React.CSSProperties}
              onClick={() => sceneRef.current?.select(index)}
            >
              {organ.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
