import type { Lang } from "../lib/i18n";
import type { Organ } from "./schema";

/**
 * Dictionnaire d'interface — Sprint 15, point 4.
 *
 * Extraction volontairement partielle : la charte (§ SPRINT.md Sprint 15,
 * « reste ») documente honnêtement ce qui manque plutôt que de prétendre à une
 * couverture totale. Ce fichier couvre le chrome global (bascule de langue,
 * bandeau pédagogique, mentions de marque) et les libellés de la fiche organe
 * les plus visibles ; le reste des chaînes des composants (boutons d'outils
 * 3D, formulaires de compte) reste en dur en français, à extraire au fil des
 * sprints suivants — un travail mécanique, pas bloquant pour livrer le reste
 * du Sprint 15.
 */
export const UI_STRINGS = {
  bascule_langue: {
    fr: "Changer de langue, français ou anglais",
    en: "Switch language, French or English",
  },
  disclaimer: {
    fr: "Outil pédagogique — ne remplace ni un cours ni un avis médical.",
    en: "Educational tool — not a substitute for coursework or medical advice.",
  },
  glossaire_titre: { fr: "Glossaire haoussa / zarma", en: "Hausa / Zarma glossary" },
  glossaire_intro: {
    fr: "Le vocabulaire local est un apport culturel, posé à côté de la nomenclature internationale — jamais à sa place (CLAUDE.md §8).",
    en: "Local vocabulary is a cultural contribution, placed alongside international nomenclature — never in its place (CLAUDE.md §8).",
  },
  glossaire_zarma_attente: {
    fr: "Zarma à compléter — inventer un terme serait pire que laisser la case vide. Voir SPRINT.md, « À faire à la main ».",
    en: "Zarma still to come — inventing a term would be worse than leaving it blank. See SPRINT.md, “À faire à la main”.",
  },
} as const satisfies Record<string, Record<Lang, string>>;

export type UiStringKey = keyof typeof UI_STRINGS;

export function t(key: UiStringKey, lang: Lang): string {
  return UI_STRINGS[key][lang];
}

/**
 * Fusionne le miroir anglais d'un organe (`organ.en`) sur ses champs
 * rédactionnels, dans un objet qui respecte toujours le type `Organ` — pour
 * que rien en aval (moteur, hotspots, fiches) n'ait besoin de savoir que la
 * langue a changé. `id`, `model`, `icon`, `accent`, `latin` et `system`
 * restent identiques dans les deux langues : `system` reste en français pour
 * l'instant (limite connue, voir SPRINT.md — la taxonomie, elle, porte déjà
 * un `english` par système).
 */
export function translateOrgan(organ: Organ, lang: Lang): Organ {
  if (lang === "fr") return organ;
  const en = organ.en;

  const hotspotById = new Map(en.hotspots.map((h) => [h.id, h]));

  return {
    ...organ,
    name: en.name,
    description: en.description,
    poetic: en.poetic,
    taille: en.taille,
    poids: en.poids,
    situation: en.situation,
    fonction: en.fonction,
    vascularisation: en.vascularisation,
    innervation: en.innervation,
    drainage: en.drainage,
    histologie: en.histologie,
    physiologie: en.physiologie,
    rapports: en.rapports,
    leSaviezVous: en.leSaviezVous,
    pathologies: en.pathologies,
    clinique: organ.clinique.map((fait, index) => ({
      ...fait,
      titre: en.clinique[index]?.titre ?? fait.titre,
      texte: en.clinique[index]?.texte ?? fait.texte,
    })),
    ancrageNiger:
      organ.ancrageNiger && en.ancrageNiger
        ? { ...organ.ancrageNiger, titre: en.ancrageNiger.titre, texte: en.ancrageNiger.texte }
        : organ.ancrageNiger,
    hotspots: organ.hotspots.map((hotspot) => {
      const traduit = hotspotById.get(hotspot.id);
      return traduit ? { ...hotspot, label: traduit.label, detail: traduit.detail } : hotspot;
    }),
  };
}
