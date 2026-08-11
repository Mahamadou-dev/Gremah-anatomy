/**
 * Schéma du contenu anatomique.
 *
 * Règles non négociables (CLAUDE.md §8) :
 * — le **français est la langue source**, jamais une traduction ;
 * — la nomenclature latine suit la *Terminologia Anatomica* ;
 * — **toute affirmation clinique porte une source**. En cas de doute, on omet.
 *
 * Une erreur médicale est un bug bloquant, au même titre qu'un crash. Le champ
 * `sources` n'est pas décoratif : il est validé au build par `tests/contenu.test.mts`.
 */

export type OrganId =
  "heart" | "brain" | "lungs" | "liver" | "kidneys" | "eyeball" | "intestine" | "pancreas" | "skin";

/** Ouvrage ou document de référence. Pas de numéro de page inventé. */
export type Source = {
  /** Clé courte réutilisable, ex. « gray ». */
  id: string;
  /** Référence complète telle qu'elle s'affiche. */
  citation: string;
};

/** Un fait clinique, toujours accompagné de la clé de sa source. */
export type FaitClinique = {
  titre: string;
  texte: string;
  /** Clé présente dans `SOURCES`. */
  source: string;
};

export type Hotspot = {
  id: string;
  /** Libellé français affiché sur le point. */
  label: string;
  /** Une ligne — c'est ce que lit l'étudiant avant de cliquer. */
  detail: string;
  /** Terme latin (Terminologia Anatomica), affiché dans la fiche. */
  latin?: string;
  position: [number, number, number];
  color: string;
};

export type Organ = {
  id: OrganId;
  /** Nom français — la langue source. */
  name: string;
  /** Terminologia Anatomica. */
  latin: string;
  /** Nom anglais, pour retrouver la littérature internationale. */
  english: string;
  system: string;
  model: string;
  icon: string;
  accent: string;
  /** Vrai si `/anatomy/<id>/*.webp` existe ; sinon on retombe sur le glyphe. */
  illustrated: boolean;

  /** Deux phrases qui situent l'organe. */
  description: string;
  /** Une formule courte, mémorable, affichée sous le titre. */
  poetic: string;

  /** Repères de dissection et de sémiologie. */
  taille: string;
  poids: string;
  situation: string;
  fonction: string;
  vascularisation: string;
  innervation: string;
  drainage: string;

  /** Ce qu'on voit au microscope — le lien anatomie/histologie. */
  histologie: string;
  /** Ce que l'organe fait, en points successifs. */
  physiologie: string[];
  /** Rapports anatomiques : ce que les examens interrogent réellement. */
  rapports: string;

  /** Corrélations cliniques, chacune sourcée. */
  clinique: FaitClinique[];
  /** Ancrage sur les pathologies prévalentes au Niger, sourcé. */
  ancrageNiger?: FaitClinique;
  /** Pathologies fréquentes, listées sans commentaire. */
  pathologies: string[];
  /** Un fait marquant, vérifiable. */
  leSaviezVous: string;

  /** Vocabulaire local — contribution culturelle, pas traduction médicale. */
  vernaculaire?: { hausa?: string; zarma?: string };

  hotspots: Hotspot[];
  sources: string[];
};
