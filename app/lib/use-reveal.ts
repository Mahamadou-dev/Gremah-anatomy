"use client";

import { useEffect } from "react";

/**
 * Révélation au défilement, en `IntersectionObserver` et non en écouteur de
 * scroll : le navigateur fait le travail hors du thread principal, ce qui compte
 * sur les appareils que ce projet vise.
 *
 * Chaque élément portant `data-reveal` reçoit `data-revealed="true"` une fois
 * entré dans le viewport, et n'est plus observé. L'animation elle-même vit en
 * CSS, où `prefers-reduced-motion` la neutralise sans code conditionnel.
 */
export function useReveal(rootRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef?.current ?? document;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      // Sans observateur, tout révéler immédiatement : un contenu invisible est
      // un bug bien plus grave qu'une animation manquante.
      targets.forEach((element) => (element.dataset.revealed = "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      // Marge négative en bas : l'élément se révèle quand il est franchement
      // entré, pas au premier pixel — sinon l'animation est déjà finie qu'on ne
      // l'a pas encore vue.
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rootRef]);
}
