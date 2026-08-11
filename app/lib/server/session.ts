/**
 * Sessions signées, sans stockage serveur.
 *
 * Un jeton porte l'email et une date d'expiration, scellés par un HMAC-SHA256.
 * Pas de table de sessions : rien à purger, rien à répliquer, et une fonction
 * serverless sans état peut le vérifier seule.
 *
 * Écrit sur **WebCrypto** et non sur `node:crypto`, parce que ce module tourne
 * dans deux environnements : les routes `app/api/` (Node) et le middleware
 * (runtime Edge, où `node:crypto` n'existe pas). Une seule implémentation, donc
 * aucun risque que les deux divergent sur ce qu'elles acceptent.
 */

export const COOKIE_SESSION = "gremah_session";

/** Trente jours : un semestre de révisions ne doit pas demander dix connexions. */
export const DUREE_SESSION_SECONDES = 30 * 24 * 60 * 60;

export type Session = { email: string; expireLe: number };

function secret(): Uint8Array {
  const valeur = process.env.AUTH_SECRET;
  if (!valeur || valeur.length < 32) {
    throw new Error(
      "AUTH_SECRET est absent ou trop court (32 caractères minimum). " +
        "Générez-en un avec : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return new TextEncoder().encode(valeur);
}

async function cle(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    secret() as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encoderBase64Url(octets: ArrayBuffer | Uint8Array): string {
  const vue = octets instanceof Uint8Array ? octets : new Uint8Array(octets);
  let binaire = "";
  for (const octet of vue) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decoderBase64Url(valeur: string): Uint8Array {
  const binaire = atob(valeur.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binaire, (caractere) => caractere.charCodeAt(0));
}

/** Émet un jeton `charge.signature`, valable `DUREE_SESSION_SECONDES`. */
export async function creerJeton(email: string): Promise<string> {
  const session: Session = {
    email,
    expireLe: Math.floor(Date.now() / 1000) + DUREE_SESSION_SECONDES,
  };
  const charge = encoderBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign("HMAC", await cle(), new TextEncoder().encode(charge));
  return `${charge}.${encoderBase64Url(signature)}`;
}

/**
 * Vérifie et décode un jeton. Renvoie `null` sur signature invalide, jeton
 * expiré ou charge illisible — jamais d'exception : un cookie bricolé par un
 * visiteur ne doit produire qu'une déconnexion, pas une erreur 500.
 */
export async function lireJeton(jeton: string | undefined): Promise<Session | null> {
  if (!jeton) return null;
  const [charge, signature] = jeton.split(".");
  if (!charge || !signature) return null;

  try {
    const valide = await crypto.subtle.verify(
      "HMAC",
      await cle(),
      decoderBase64Url(signature) as BufferSource,
      new TextEncoder().encode(charge),
    );
    if (!valide) return null;

    const session = JSON.parse(new TextDecoder().decode(decoderBase64Url(charge))) as Session;
    if (typeof session.email !== "string" || typeof session.expireLe !== "number") return null;
    if (session.expireLe * 1000 < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Options du cookie de session.
 *
 * `httpOnly` : inaccessible au JavaScript de la page, donc hors de portée d'une
 * injection de script. `sameSite: "lax"` : suffisant pour bloquer le CSRF sur
 * les requêtes d'écriture tout en survivant à un lien partagé par WhatsApp.
 * `secure` seulement en production — en local, `http://localhost` le refuserait
 * et personne ne pourrait se connecter en développement.
 */
export function optionsCookie() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_SESSION_SECONDES,
  };
}
