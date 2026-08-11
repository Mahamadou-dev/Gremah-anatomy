import type { Source } from "./schema";

/**
 * Les ouvrages sur lesquels le contenu s'appuie.
 *
 * On cite l'ouvrage, jamais une page : un numéro de page varie d'une édition à
 * l'autre, et une référence précise qu'on ne peut pas vérifier vaut moins que
 * pas de référence du tout. L'étudiant qui veut approfondir sait où chercher.
 */
export const SOURCES: Source[] = [
  {
    id: "gray",
    citation:
      "Drake R., Vogl W., Mitchell A. — « Gray's Anatomy for Students », Elsevier. Référence d'anatomie descriptive et topographique.",
  },
  {
    id: "moore",
    citation:
      "Moore K., Dalley A., Agur A. — « Anatomie médicale : aspects fondamentaux et applications cliniques », De Boeck Supérieur.",
  },
  // Netter a été retiré de cette liste : les illustrations du site n'en sont pas
  // tirées, et citer un ouvrage qu'on n'a pas utilisé est une fausse caution.
  {
    id: "ta",
    citation:
      "Federative International Programme on Anatomical Terminologies — « Terminologia Anatomica », 2ᵉ éd. Nomenclature latine officielle.",
  },
  {
    id: "guyton",
    citation: "Hall J., Hall M. — « Guyton and Hall Textbook of Medical Physiology », Elsevier.",
  },
  {
    id: "junqueira",
    citation: "Mescher A. — « Junqueira's Basic Histology », McGraw Hill. Référence d'histologie.",
  },
  {
    id: "oms-paludisme",
    citation:
      "Organisation mondiale de la Santé — Paludisme, principaux repères. who.int/fr/news-room/fact-sheets/detail/malaria",
  },
  {
    id: "oms-meningite",
    citation:
      "Organisation mondiale de la Santé — Méningite à méningocoques et ceinture africaine de la méningite. who.int/fr",
  },
  {
    id: "oms-tuberculose",
    citation:
      "Organisation mondiale de la Santé — Tuberculose, principaux repères. who.int/fr/news-room/fact-sheets/detail/tuberculosis",
  },
  {
    id: "oms-hepatiteb",
    citation:
      "Organisation mondiale de la Santé — Hépatite B, principaux repères. who.int/fr/news-room/fact-sheets/detail/hepatitis-b",
  },
  {
    id: "oms-drepanocytose",
    citation:
      "Organisation mondiale de la Santé — Drépanocytose. Bureau régional de l'OMS pour l'Afrique, afro.who.int",
  },
  {
    id: "oms-rhumatisme",
    citation:
      "Organisation mondiale de la Santé — Cardiopathie rhumatismale, principaux repères. who.int/fr/news-room/fact-sheets/detail/rheumatic-heart-disease",
  },
  {
    id: "oms-schistosomiase",
    citation:
      "Organisation mondiale de la Santé — Schistosomiase (bilharziose), principaux repères. who.int/fr",
  },
  {
    id: "oms-trachome",
    citation:
      "Organisation mondiale de la Santé — Trachome, principaux repères. who.int/fr/news-room/fact-sheets/detail/trachoma",
  },
  {
    id: "oms-vitaminea",
    citation:
      "Organisation mondiale de la Santé — Carence en vitamine A et xérophtalmie. who.int/fr/data/nutrition",
  },
  {
    id: "oms-diarrhee",
    citation:
      "Organisation mondiale de la Santé — Maladies diarrhéiques, principaux repères. who.int/fr/news-room/fact-sheets/detail/diarrhoeal-disease",
  },
  {
    id: "oms-diabete",
    citation:
      "Organisation mondiale de la Santé — Diabète, principaux repères. who.int/fr/news-room/fact-sheets/detail/diabetes",
  },
];

export const SOURCE_BY_ID = new Map(SOURCES.map((source) => [source.id, source]));

/**
 * Avertissement affiché partout où du contenu médical apparaît.
 * Exigé par CLAUDE.md §8 : cet atlas est un outil pédagogique.
 */
export const AVERTISSEMENT =
  "Gremah Anatomy est un outil pédagogique. Il ne remplace ni un cours, ni un ouvrage " +
  "de référence, ni l'avis d'un médecin. Le contenu s'appuie sur les ouvrages listés " +
  "en sources et doit être confronté à votre enseignement.";
