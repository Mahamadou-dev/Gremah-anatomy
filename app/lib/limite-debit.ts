/**
 * Politique de limitation de débit — module **pur**.
 *
 * Ni Mongo, ni React, ni API navigateur : uniquement la décision « on laisse
 * passer ou non », à partir de compteurs déjà mesurés. C'est cette logique qu'on
 * veut vérifier sous `node --test`, pas la capacité de Mongo à compter.
 *
 * Le stockage vit dans `lib/server/limite-debit.ts`, qui appelle ces fonctions.
 */

/** Durée de la fenêtre glissante d'observation. */
export const FENETRE_MINUTES = 15;

/**
 * Plafonds distincts par email et par IP.
 *
 * Celui par IP est volontairement large : au Niger, un cybercafé, un partage de
 * connexion ou un simple opérateur mobile placent des dizaines d'étudiants
 * derrière une seule adresse. Un plafond serré y bloquerait une classe entière
 * pour l'étourderie d'un seul. C'est le plafond par email qui protège vraiment
 * un compte donné ; celui par IP ne vise que le balayage massif.
 */
export const PLAFOND_EMAIL = 8;
export const PLAFOND_IP = 40;

/** Créations de comptes tolérées depuis une même adresse, par fenêtre. */
export const PLAFOND_CREATIONS = 10;

export type Verdict =
  { autorise: true } | { autorise: false; secondesAvantReessai: number; motif: "email" | "ip" };

/**
 * Fenêtre **glissante** et non fixe : une fenêtre fixe (« 10 essais par quart
 * d'heure ») autorise 20 essais d'affilée à cheval sur deux fenêtres.
 *
 * `plusAncienneEnSecondes` est l'âge de la plus ancienne tentative encore dans
 * la fenêtre : c'est sa sortie qui débloquera l'appelant.
 */
export function evaluer(
  tentativesEmail: number,
  tentativesIp: number,
  plusAncienneEnSecondes: number | null,
): Verdict {
  const depassementEmail = tentativesEmail >= PLAFOND_EMAIL;
  const depassementIp = tentativesIp >= PLAFOND_IP;
  if (!depassementEmail && !depassementIp) return { autorise: true };

  return {
    autorise: false,
    secondesAvantReessai: delaiRestant(plusAncienneEnSecondes),
    motif: depassementEmail ? "email" : "ip",
  };
}

/** Même décision, pour les créations de comptes : une seule clé, un seul plafond. */
export function evaluerCreation(creations: number, plusAncienneEnSecondes: number | null): Verdict {
  if (creations < PLAFOND_CREATIONS) return { autorise: true };
  return {
    autorise: false,
    secondesAvantReessai: delaiRestant(plusAncienneEnSecondes),
    motif: "ip",
  };
}

/**
 * Le plancher à une seconde n'est pas cosmétique : une tentative plus vieille
 * que la fenêtre donnerait un délai négatif, donc un « réessayez dans 0 minute »
 * qui invite précisément à marteler le formulaire.
 */
function delaiRestant(plusAncienneEnSecondes: number | null): number {
  const fenetre = FENETRE_MINUTES * 60;
  if (plusAncienneEnSecondes === null) return fenetre;
  return Math.max(1, fenetre - plusAncienneEnSecondes);
}

/**
 * Message affiché à l'étudiant.
 *
 * Ni compteur ni plafond n'y figurent : annoncer « 3 tentatives restantes »
 * dirait à un attaquant exactement de combien d'essais il dispose encore.
 */
export function messageBlocage(secondes: number): string {
  const minutes = Math.ceil(secondes / 60);
  return `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}
