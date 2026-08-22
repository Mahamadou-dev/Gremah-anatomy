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

    // `requestIdleCallback` (repli : un court `setTimeout`) plutôt qu'un appel
    // direct : ce composant est déjà chargé paresseusement (voir Landing.tsx),
    // mais créer le renderer WebGL/WebGPU et démarrer le chargement des
    // modèles reste le morceau de JS le plus coûteux de la page. Le repousser
    // d'un tour laisse le thread principal finir l'hydratation et devenir
    // interactif avant de payer ce coût — ça ne retarde le rendu de la scène
    // que de quelques millisecondes, invisibles derrière le poster.
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 1);
    const cancelIdle =
      typeof window.cancelIdleCallback === "function"
        ? window.cancelIdleCallback
        : window.clearTimeout;
    const idleHandle = idle(() => {
      if (sceneRef.current === scene) void scene.start();
    });

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
      cancelIdle(idleHandle as number);
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
