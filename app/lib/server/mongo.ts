import { MongoClient, type Collection, type Db } from "mongodb";
import type { ProfilPublic } from "../compte";

/**
 * Connexion à MongoDB Atlas — **serveur uniquement**.
 *
 * Ce fichier ne doit jamais atteindre le navigateur : `MONGODB_URI` porte les
 * identifiants du cluster. Il n'est importé que par des routes `app/api/`, qui
 * s'exécutent sur Vercel et jamais côté client. Le driver parle un protocole
 * binaire sur TCP : c'est précisément pour ça qu'un navigateur ne peut pas
 * joindre Atlas directement, et que ces quelques fonctions existent.
 */

export type DocumentCompte = {
  email: string;
  prenom: string;
  nom: string;
  pays: string;
  region: string;
  /** `scrypt` : sel et empreinte, encodés ensemble. Voir `mots-de-passe.ts`. */
  motDePasseHache: string;
  creeLe: Date;
  derniereConnexion: Date | null;
};

const NOM_BASE = process.env.MONGODB_DB ?? "gremah_anatomy";

/**
 * Le client est mémorisé sur `globalThis` et non dans un module : en
 * développement, le rechargement à chaud réévalue les modules à chaque
 * modification, et une connexion neuve par rechargement épuise le pool d'Atlas
 * en quelques minutes.
 */
const cache = globalThis as unknown as { _mongo?: Promise<MongoClient> };

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI est absent. Renseignez-le dans .env.local (voir .env.example) " +
        "ou dans les variables d'environnement du projet Vercel.",
    );
  }
  cache._mongo ??= new MongoClient(uri, {
    // Un étudiant qui attend un formulaire de connexion préfère un message
    // d'erreur en cinq secondes à une page qui tourne trente secondes.
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    // Un cluster M0 gratuit plafonne à 100 connexions simultanées, et chaque
    // instance de fonction serverless ouvre son propre pool. Sans plafond par
    // instance, une pointe de trafic — ou plusieurs sites sur le même cluster —
    // épuise le quota et fait échouer les connexions de tout le monde.
    maxPoolSize: 5,
    // Les instances Vercel sont recyclées : une connexion oisive gardée trop
    // longtemps occupe un slot pour un processus qui ne reviendra pas.
    maxIdleTimeMS: 60_000,
  })
    .connect()
    .catch((erreur: unknown) => {
      // Sans cette remise à zéro, une promesse rejetée resterait en cache pour
      // toute la vie de l'instance : une fois la liste d'accès Atlas corrigée,
      // les requêtes continueraient d'échouer jusqu'au recyclage de la fonction.
      // C'est exactement le genre de panne qui « se répare toute seule au bout
      // d'un moment » et qu'on ne comprend jamais.
      delete cache._mongo;
      throw enrichir(erreur);
    });
  return cache._mongo;
}

/**
 * Traduit les échecs de connexion opaques en cause probable.
 *
 * Atlas refuse une adresse absente de sa liste d'accès en coupant la poignée de
 * main TLS, pas en répondant « accès refusé » : le driver ne voit qu'une alerte
 * SSL 80, illisible pour qui ne connaît pas ce comportement. Comme le message
 * finit dans les journaux Vercel à trois heures du matin, il vaut mieux qu'il
 * nomme la manipulation à faire.
 */
function enrichir(erreur: unknown): unknown {
  const texte = erreur instanceof Error ? erreur.message : String(erreur);
  if (/tlsv1 alert internal error|SSL alert number 80|ERR_SSL_TLSV1_ALERT/i.test(texte)) {
    return new Error(
      "Connexion à MongoDB Atlas refusée au niveau TLS. Cause quasi certaine : " +
        "l'adresse IP de l'appelant n'est pas dans la liste d'accès du cluster. " +
        "Atlas → Network Access → Add IP Address → Allow Access from Anywhere " +
        "(0.0.0.0/0), indispensable pour des fonctions serverless dont l'IP change " +
        `à chaque exécution. Détail d'origine : ${texte}`,
      { cause: erreur },
    );
  }
  if (/Authentication failed|bad auth/i.test(texte)) {
    return new Error(
      "Identifiants MongoDB refusés. Vérifiez l'utilisateur et le mot de passe de " +
        "MONGODB_URI — si le mot de passe contient @ : / ou #, il doit être encodé " +
        `en URL (@ devient %40). Détail d'origine : ${texte}`,
      { cause: erreur },
    );
  }
  return erreur;
}

export async function base(): Promise<Db> {
  return (await client()).db(NOM_BASE);
}

/**
 * La collection des comptes, avec son index unique.
 *
 * L'unicité est garantie par la base et non par une vérification préalable :
 * deux inscriptions simultanées avec le même email passeraient toutes les deux
 * un `findOne` avant que l'une des deux n'écrive. Seul l'index tranche.
 */
export async function comptes(): Promise<Collection<DocumentCompte>> {
  const collection = (await base()).collection<DocumentCompte>("comptes");
  await collection.createIndex({ email: 1 }, { unique: true });
  return collection;
}

/** Ne laisse sortir que ce que le client a le droit de connaître. */
export function profilPublic(document: DocumentCompte): ProfilPublic {
  return {
    prenom: document.prenom,
    nom: document.nom,
    email: document.email,
    pays: document.pays,
    region: document.region,
  };
}
