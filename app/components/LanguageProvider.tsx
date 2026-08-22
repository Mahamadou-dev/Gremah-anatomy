"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { resolveLang, writeLangOverride, type Lang } from "../lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Fournit la langue courante à tout l'arbre. Le rendu serveur est toujours en
 * français (`app/layout.tsx` déclare `lang="fr"`) ; un effet bascule vers la
 * langue mémorisée ou détectée juste après le montage — contrairement au
 * bootstrap de thème du layout (pur CSS, appliqué avant hydratation), le
 * contenu ici est porté par React et ne peut basculer qu'une fois l'arbre
 * hydraté. Un visiteur anglophone voit donc une fraction de seconde de
 * français avant la bascule — un compromis assumé tant que le routage par
 * langue (`/fr/`, `/en/`) n'existe pas, voir SPRINT.md.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // L'état initial DOIT être "fr" sur le serveur ET au premier rendu client :
  // c'est ce que le HTML statique porte déjà (`<html lang="fr">`), et
  // diverger ici casserait l'hydratation (le texte français rendu par le
  // serveur ne correspondrait plus à l'arbre React du premier rendu client).
  // Lire `localStorage`/`navigator.language` ne peut donc se faire qu'après
  // le montage, dans un effet — la seule exception légitime à la règle
  // générale « pas de setState dans un effet » : cette lecture dépend d'une
  // API navigateur strictement indisponible pendant le rendu lui-même.
  const [lang, setLangState] = useState<Lang>("fr");

  // Lecture d'une API navigateur (localStorage/navigator.language) indisponible
  // au rendu ; voir le commentaire sur l'état initial ci-dessus.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(resolveLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    writeLangOverride(next);
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

/** Hors d'un `LanguageProvider`, retombe sur le français plutôt que de jeter —
 *  utile pour des composants testés isolément. */
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext) ?? { lang: "fr", setLang: () => {} };
}
