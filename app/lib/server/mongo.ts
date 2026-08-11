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
  }).connect();
  return cache._mongo;
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
