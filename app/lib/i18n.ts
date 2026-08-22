/**
 * Langue d'affichage — Sprint 15.
 *
 * Module pur, sans DOM ni React, à l'image de `engine/core/capabilities.ts` :
 * testable sous `node --test`, seul point de contact avec `localStorage` et
 * `navigator`.
 */

export type Lang = "fr" | "en";

export const LANGS: readonly Lang[] = ["fr", "en"];

export function isLang(value: unknown): value is Lang {
  return value === "fr" || value === "en";
}

const STORAGE_KEY = "gremah-lang";

/** Détecte la langue du navigateur à la première visite — pas de compte requis. */
export function detectLang(navigatorLanguage: string | undefined): Lang {
  if (!navigatorLanguage) return "fr";
  return navigatorLanguage.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function readLangOverride(): Lang | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeLangOverride(lang: Lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Navigation privée ou stockage bloqué : le choix vaut pour la session en cours.
  }
}

/** Langue effective au premier rendu client : la mémorisation gagne sur la détection. */
export function resolveLang(): Lang {
  if (typeof window === "undefined") return "fr";
  return readLangOverride() ?? detectLang(window.navigator?.language);
}
