import type { Collection } from "mongodb";
import { base } from "./mongo";
import { evaluer, evaluerCreation, FENETRE_MINUTES, type Verdict } from "../limite-debit";

/**
 * Comptage des tentatives — **serveur uniquement**.
 *
 * Sans limite, rien n'empêche d'essayer des mots de passe en boucle sur
 * `/api/connexion` : quelques milliers d'essais par minute suffisent à casser un
 * mot de passe faible, et à saturer le quota de fonctions Vercel au passage.
 *
 * **Pourquoi en base et non en mémoire.** Chaque instance de fonction serverless
 * a sa propre mémoire, et Vercel en démarre autant qu'il veut. Un compteur en
 * mémoire ne verrait qu'une fraction des tentatives — il suffirait d'envoyer les
 * requêtes en parallèle pour passer entre les gouttes. Mongo est le seul état
 * partagé dont on dispose, et un index TTL fait le ménage tout seul.
 *
 * La décision elle-même vit dans `lib/limite-debit.ts`, module pur et testé.
 */

export type Tentative = {
  /** `email:aicha@x.ne`, `ip:41.203.x.x` ou `creation:41.203.x.x`. */
  cle: string;
  horodatage: Date;
};

async function collection(): Promise<Collection<Tentative>> {
  const col = (await base()).collection<Tentative>("tentatives");
  // L'index TTL est ce qui rend le mécanisme gratuit à exploiter : Mongo purge
  // les documents périmés lui-même, il n'y a aucune tâche de nettoyage à écrire
  // ni à programmer.
  await col.createIndex({ horodatage: 1 }, { expireAfterSeconds: FENETRE_MINUTES * 60 });
  await col.createIndex({ cle: 1, horodatage: -1 });
  return col;
}

/**
 * L'adresse de l'appelant, telle que Vercel la transmet.
 *
 * `x-forwarded-for` peut contenir une chaîne de mandataires : la première entrée
 * est le client d'origine. Sur Vercel, l'en-tête est réécrit à l'entrée, donc un
 * client ne peut pas le falsifier — ce qui ne serait pas vrai derrière un
 * mandataire mal configuré.
 */
export function adresseAppelant(requete: Request): string {
  const transmis = requete.headers.get("x-forwarded-for");
  if (transmis) return transmis.split(",")[0]!.trim();
  return requete.headers.get("x-real-ip") ?? "inconnue";
}

/** Compte les documents d'une clé dans la fenêtre, et l'âge du plus ancien. */
async function mesurer(cles: string[]): Promise<{ compteurs: number[]; ageMax: number | null }> {
  const col = await collection();
  const depuis = new Date(Date.now() - FENETRE_MINUTES * 60_000);

  const [compteurs, plusAncienne] = await Promise.all([
    Promise.all(cles.map((cle) => col.countDocuments({ cle, horodatage: { $gte: depuis } }))),
    col.findOne({ cle: { $in: cles }, horodatage: { $gte: depuis } }, { sort: { horodatage: 1 } }),
  ]);

  const ageMax = plusAncienne
    ? Math.floor((Date.now() - plusAncienne.horodatage.getTime()) / 1000)
    : null;
  return { compteurs, ageMax };
}

/**
 * Vérifie les compteurs **avant** toute vérification de mot de passe : `scrypt`
 * coûte une centaine de millisecondes et 32 Mo, c'est exactement le calcul qu'un
 * attaquant chercherait à nous faire répéter.
 */
export async function verifier(email: string, ip: string): Promise<Verdict> {
  const { compteurs, ageMax } = await mesurer([`email:${email}`, `ip:${ip}`]);
  return evaluer(compteurs[0]!, compteurs[1]!, ageMax);
}

/** Enregistre un échec de connexion. Les deux clés sont incrémentées ensemble. */
export async function enregistrerEchec(email: string, ip: string): Promise<void> {
  const horodatage = new Date();
  await (
    await collection()
  ).insertMany([
    { cle: `email:${email}`, horodatage },
    { cle: `ip:${ip}`, horodatage },
  ]);
}

/**
 * Efface le compteur d'un email après une connexion réussie.
 *
 * Le compteur par IP, lui, est conservé : sinon quelqu'un possédant un seul
 * compte valide remettrait son quota à zéro entre deux séries d'essais.
 */
export async function oublierEchecs(email: string): Promise<void> {
  await (await collection()).deleteMany({ cle: `email:${email}` });
}

/**
 * Créations de comptes par adresse.
 *
 * Un formulaire d'inscription public sans plafond finit rempli de comptes
 * fabriqués — ils ne volent rien, mais ils faussent les statistiques d'usage,
 * qui sont justement la raison d'être des champs pays et région, et ils
 * grignotent les 512 Mo du cluster gratuit.
 *
 * Clé distincte de celle des connexions : une inscription ratée ne doit pas
 * rapprocher un cybercafé du blocage de connexion, et inversement.
 */
export async function verifierCreation(ip: string): Promise<Verdict> {
  const { compteurs, ageMax } = await mesurer([`creation:${ip}`]);
  return evaluerCreation(compteurs[0]!, ageMax);
}

export async function enregistrerCreation(ip: string): Promise<void> {
  await (await collection()).insertOne({ cle: `creation:${ip}`, horodatage: new Date() });
}
