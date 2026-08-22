"use client";

import { useLanguage } from "./LanguageProvider";
import { t } from "../content/traductions";

/**
 * Bascule FR/EN — Sprint 15, point 3. Contrairement au thème (CSS pur), la
 * langue pilote du contenu React ; la bascule passe donc par le contexte
 * `LanguageProvider` plutôt que par une manipulation DOM directe. Elle ne
 * navigue jamais : la page et l'organe affichés restent ceux d'avant le clic,
 * ce qu'exige SPRINT.md (« la bascule conserve le contexte »).
 */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const next = lang === "fr" ? "en" : "fr";

  return (
    <button
      type="button"
      className="language-toggle"
      onClick={() => setLang(next)}
      aria-label={t("bascule_langue", lang)}
      title={t("bascule_langue", lang)}
    >
      <span aria-hidden="true">{lang === "fr" ? "FR" : "EN"}</span>
    </button>
  );
}
