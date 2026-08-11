import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hachage des mots de passe — **serveur uniquement**.
 *
 * `scrypt` plutôt qu'argon2 ou bcrypt : il est dans le `node:crypto` standard,
 * donc zéro dépendance à justifier (CLAUDE.md §3) et zéro binaire natif à
 * compiler sur Vercel. C'est une fonction de dérivation à coût mémoire, ce qui
 * est exactement la propriété qui rend une attaque par GPU coûteuse — ce que
 * SHA-256 seul, salé ou non, ne fait pas.
 */

const deriver = promisify(scrypt) as (
  motDePasse: string,
  sel: Buffer,
  longueur: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * N = 2^15 : environ 100 ms et 32 Mo par vérification sur une fonction Vercel.
 * Assez lent pour rendre une attaque hors ligne pénible, assez rapide pour que
 * la connexion reste instantanée. `maxmem` doit être relevé explicitement, la
 * valeur par défaut de Node (32 Mo) refuserait ce paramétrage de justesse.
 */
const PARAMETRES = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
const LONGUEUR_SEL = 16;
const LONGUEUR_EMPREINTE = 32;

/** Format : `scrypt$N$r$p$sel$empreinte`, tout en base64url. */
export async function hacher(motDePasse: string): Promise<string> {
  const sel = randomBytes(LONGUEUR_SEL);
  const empreinte = await deriver(motDePasse, sel, LONGUEUR_EMPREINTE, PARAMETRES);
  const { N, r, p } = PARAMETRES;
  return `scrypt$${N}$${r}$${p}$${sel.toString("base64url")}$${empreinte.toString("base64url")}`;
}

/**
 * Vérifie un mot de passe contre une empreinte stockée.
 *
 * Les paramètres sont relus depuis l'empreinte et non repris des constantes :
 * le jour où `N` sera relevé, les comptes existants doivent continuer de se
 * connecter. Renvoie `false` sur toute anomalie plutôt que de lever — un
 * enregistrement corrompu ne doit pas ouvrir de session.
 */
export async function verifier(motDePasse: string, stocke: string): Promise<boolean> {
  const parties = stocke.split("$");
  if (parties.length !== 6 || parties[0] !== "scrypt") return false;

  const [, n, r, p, selEncode, empreinteEncodee] = parties;
  const options = {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: PARAMETRES.maxmem,
  };
  if (
    !Number.isInteger(options.N) ||
    !Number.isInteger(options.r) ||
    !Number.isInteger(options.p)
  ) {
    return false;
  }

  try {
    const attendue = Buffer.from(empreinteEncodee, "base64url");
    const calculee = await deriver(
      motDePasse,
      Buffer.from(selEncode, "base64url"),
      attendue.length,
      options,
    );
    // Comparaison à temps constant : un `===` fuiterait, par sa durée, le
    // nombre d'octets corrects en tête d'empreinte.
    return attendue.length === calculee.length && timingSafeEqual(attendue, calculee);
  } catch {
    return false;
  }
}
