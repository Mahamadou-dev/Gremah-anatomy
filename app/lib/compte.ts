/**
 * Le compte étudiant, vu des deux côtés.
 *
 * Ce module est **pur** : ni Mongo, ni React, ni API navigateur. C'est ce qui
 * permet au formulaire et à la route serveur de valider exactement la même
 * chose — une validation qui diverge entre les deux est un trou de sécurité
 * déguisé en bug d'ergonomie — et de tester les règles sous `node --test`.
 */

/** Régions du Niger, telles qu'elles sont administrativement définies. */
export const REGIONS_NIGER = [
  "Agadez",
  "Diffa",
  "Dosso",
  "Maradi",
  "Niamey",
  "Tahoua",
  "Tillabéri",
  "Zinder",
] as const;

/**
 * Le projet vise le Niger, mais les cursus francophones circulent : un étudiant
 * nigérien en échange à Ouagadougou ou à Tunis doit pouvoir s'inscrire. La liste
 * couvre la sous-région, et « Autre » évite de fermer la porte au reste.
 */
export const PAYS = [
  "Niger",
  "Bénin",
  "Burkina Faso",
  "Cameroun",
  "Côte d'Ivoire",
  "Mali",
  "Maroc",
  "Nigeria",
  "Sénégal",
  "Tchad",
  "Togo",
  "Tunisie",
  "Autre",
] as const;

export type Inscription = {
  prenom: string;
  nom: string;
  email: string;
  pays: string;
  region: string;
  motDePasse: string;
};

/** Ce que le client apprend de son propre compte. Jamais le hachage, jamais le sel. */
export type ProfilPublic = {
  prenom: string;
  nom: string;
  email: string;
  pays: string;
  region: string;
};

/** Erreurs par champ. Un objet vide signifie « valide ». */
export type ErreursChamps = Partial<Record<keyof Inscription, string>>;

/**
 * Longueur minimale du mot de passe.
 *
 * Douze et non huit : ces comptes s'ouvrent souvent depuis un téléphone partagé,
 * et la seule défense réelle contre une attaque par dictionnaire hors ligne est
 * la longueur. Aucune exigence de casse ni de caractère spécial — elles
 * produisent `Passw0rd!` et rien de plus.
 */
export const LONGUEUR_MIN_MOT_DE_PASSE = 12;

/** Plafond : au-delà, on ne fait que payer du calcul de dérivation pour rien. */
export const LONGUEUR_MAX_MOT_DE_PASSE = 128;

/**
 * Validation d'email volontairement permissive. La seule vérification qui
 * prouve qu'une adresse existe est de lui écrire ; une expression rationnelle
 * plus stricte ne ferait que rejeter des adresses valides et rares.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normalise l'email : c'est cette forme qui est stockée et comparée. */
export function normaliserEmail(valeur: string): string {
  return valeur.trim().toLowerCase();
}

export function validerInscription(saisie: Partial<Inscription>): ErreursChamps {
  const erreurs: ErreursChamps = {};
  const prenom = saisie.prenom?.trim() ?? "";
  const nom = saisie.nom?.trim() ?? "";
  const email = normaliserEmail(saisie.email ?? "");
  const pays = saisie.pays?.trim() ?? "";
  const region = saisie.region?.trim() ?? "";
  const motDePasse = saisie.motDePasse ?? "";

  if (prenom.length < 2) erreurs.prenom = "Indiquez votre prénom.";
  if (prenom.length > 60) erreurs.prenom = "Prénom trop long.";
  if (nom.length < 2) erreurs.nom = "Indiquez votre nom.";
  if (nom.length > 60) erreurs.nom = "Nom trop long.";
  if (!EMAIL.test(email)) erreurs.email = "Adresse email invalide.";
  if (email.length > 254) erreurs.email = "Adresse email trop longue.";
  if (pays.length < 2) erreurs.pays = "Choisissez un pays.";
  if (region.length < 2) erreurs.region = "Indiquez votre région ou votre ville.";
  if (region.length > 80) erreurs.region = "Région trop longue.";

  if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
    erreurs.motDePasse = `Au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`;
  } else if (motDePasse.length > LONGUEUR_MAX_MOT_DE_PASSE) {
    erreurs.motDePasse = "Mot de passe trop long.";
  } else if (motDePasse.trim().length === 0) {
    erreurs.motDePasse = "Mot de passe invalide.";
  } else if (normaliserEmail(motDePasse) === email) {
    // Le cas le plus courant de mot de passe deviné, et le seul qui vaille un
    // refus explicite : le reste des règles « complexité » ne protège de rien.
    erreurs.motDePasse = "Le mot de passe ne peut pas être votre adresse email.";
  }

  return erreurs;
}

export function validerConnexion(saisie: { email?: string; motDePasse?: string }): ErreursChamps {
  const erreurs: ErreursChamps = {};
  if (!EMAIL.test(normaliserEmail(saisie.email ?? ""))) erreurs.email = "Adresse email invalide.";
  if (!saisie.motDePasse) erreurs.motDePasse = "Saisissez votre mot de passe.";
  return erreurs;
}

export function estValide(erreurs: ErreursChamps): boolean {
  return Object.keys(erreurs).length === 0;
}
