import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { comptes } from "../../../lib/server/mongo";
import { verifier } from "../../../lib/server/mots-de-passe";
import { effacerToutPour } from "../../../lib/server/limite-debit";
import { COOKIE_SESSION, lireJeton, optionsCookie } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Suppression de compte — le droit à l'effacement de CLAUDE.md §2 bis.
 *
 * Exige le mot de passe en confirmation : un cookie de session volé ou laissé
 * ouvert sur un poste de cybercafé ne doit pas suffire à effacer un compte.
 * Efface aussi les compteurs de limitation de débit liés à l'email — sans quoi
 * une adresse supprimée resterait bloquée jusqu'à expiration TTL si quelqu'un
 * tentait de la réutiliser tout de suite après.
 */
export async function POST(request: Request) {
  const session = await lireJeton((await cookies()).get(COOKIE_SESSION)?.value);
  if (!session) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

  let saisie: { motDePasse?: string };
  try {
    saisie = (await request.json()) as { motDePasse?: string };
  } catch {
    return NextResponse.json({ message: "Requête illisible." }, { status: 400 });
  }
  if (!saisie.motDePasse) {
    return NextResponse.json({ message: "Confirmez votre mot de passe." }, { status: 422 });
  }

  try {
    const collection = await comptes();
    const compte = await collection.findOne({ email: session.email });
    if (!compte) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    if (!(await verifier(saisie.motDePasse, compte.motDePasseHache))) {
      return NextResponse.json({ message: "Mot de passe incorrect." }, { status: 401 });
    }

    await collection.deleteOne({ email: compte.email });
    await effacerToutPour(compte.email).catch(() => {
      // Le compte est déjà supprimé, c'est ce qui compte. Un compteur de débit
      // qui traîne jusqu'à son expiration TTL ne gêne plus personne.
    });

    const reponse = NextResponse.json({ supprime: true });
    reponse.cookies.set(COOKIE_SESSION, "", { ...optionsCookie(), maxAge: 0 });
    return reponse;
  } catch (erreur) {
    console.error("compte/supprimer", erreur);
    return NextResponse.json({ message: "Service indisponible." }, { status: 503 });
  }
}
