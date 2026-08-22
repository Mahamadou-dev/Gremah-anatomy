import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION, lireJeton } from "./app/lib/server/session";

/**
 * Garde de l'atlas.
 *
 * La signature du jeton est vérifiée ici, pas seulement sa présence : sans ça,
 * un cookie écrit à la main dans la console ouvrirait la porte. La base, elle,
 * n'est pas interrogée — le middleware s'exécute sur chaque navigation, et une
 * requête Atlas à chaque page ajouterait sa latence à chacune. `/api/moi` fait
 * la confrontation avec la base là où elle compte.
 *
 * L'accueil, la page à propos et les sources restent publics : ce sont eux qui
 * expliquent le projet à quelqu'un qui n'a pas encore de compte. `/profil`
 * rejoint `/atlas` dans la garde : `ProfileForm` redirige déjà côté client sur
 * un `/api/moi` sans session, mais laisser passer la page elle-même publierait
 * un instant de squelette vide avant la redirection — la garde l'évite.
 */
export async function middleware(request: NextRequest) {
  const session = await lireJeton(request.cookies.get(COOKIE_SESSION)?.value);
  if (session) return NextResponse.next();

  const connexion = new URL("/connexion/", request.url);
  // Mémorise la destination pour y revenir après connexion : un lien partagé
  // vers `/atlas/?organe=heart` doit rouvrir sur le cœur, pas sur l'accueil.
  connexion.searchParams.set("suite", request.nextUrl.pathname + request.nextUrl.search);
  const reponse = NextResponse.redirect(connexion);

  // Un jeton expiré ou invalide traîne sinon jusqu'à sa date d'expiration et
  // provoque une redirection à chaque visite.
  if (request.cookies.has(COOKIE_SESSION)) reponse.cookies.delete(COOKIE_SESSION);
  return reponse;
}

export const config = {
  matcher: ["/atlas/:path*", "/profil/:path*"],
};
