import donnees from "../../assets/models-src/provenance.json";

/**
 * Lecture typée de `assets/models-src/provenance.json`.
 *
 * CLAUDE.md §9 : « un modèle sans provenance ne se déploie pas ». Le fichier JSON
 * est la source de vérité — écrit par le pipeline d'import, lu ici par la page
 * crédits, vérifié par `tests/provenance.test.mts`. Trois consommateurs, un seul
 * fichier : c'est ce qui empêche l'attribution de diverger de la réalité.
 */

export type IdLicence = "CC-BY-SA-4.0" | "CC-BY-SA-2.1-JP" | "indeterminee";

export type Licence = {
  nom: string;
  url: string | null;
  partageIdentique: boolean;
};

export type SourceModele = {
  nom: string;
  auteurs: string;
  url: string | null;
  licence: IdLicence;
  /** Clé d'une autre source dont celle-ci dérive — la chaîne share-alike. */
  derive?: string;
  note?: string;
};

export type ProvenanceModele = {
  source: string;
  /** Identifiant de l'objet dans le jeu de données d'origine, quand il existe. */
  identifiantOrigine: string | null;
  /** La chaîne source → licence → auteur a-t-elle été établie ? */
  verifie: boolean;
  /** Date d'import ISO, écrite par `scripts/import-anatomie.mjs`. */
  importeLe?: string;
};

export const LICENCES = donnees.licences as Record<IdLicence, Licence>;
export const SOURCES_MODELES = donnees.sources as Record<string, SourceModele>;
export const PROVENANCES = donnees.modeles as Record<string, ProvenanceModele>;

/** La licence effective d'un modèle, en remontant sa source. */
export function licenceDe(modeleId: string): Licence & { id: IdLicence } {
  const provenance = PROVENANCES[modeleId];
  const source = provenance ? SOURCES_MODELES[provenance.source] : undefined;
  const id: IdLicence = source?.licence ?? "indeterminee";
  return { id, ...LICENCES[id] };
}

/**
 * Les modèles dont la chaîne de droits n'est pas établie. La page crédits les
 * affiche explicitement : une dette annoncée est une dette qu'on peut solder,
 * une dette tue reste une fausse attribution.
 */
export const MODELES_A_TRACER = Object.entries(PROVENANCES)
  .filter(([, provenance]) => !provenance.verifie)
  .map(([id]) => id);
