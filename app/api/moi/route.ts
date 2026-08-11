import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { comptes, profilPublic } from "../../lib/server/mongo";
import { COOKIE_SESSION, lireJeton } from "../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Le profil de la session en cours. C'est ce que l'en-tête de l'atlas appelle
 * pour afficher un prénom, et c'est aussi le seul endroit qui confronte le
 * jeton à la base : le middleware, lui, ne vérifie que la signature.
 */
export async function GET() {
  const session = await lireJeton((await cookies()).get(COOKIE_SESSION)?.value);
  if (!session) return NextResponse.json({ profil: null }, { status: 401 });

  try {
    const compte = await (await comptes()).findOne({ email: session.email });
    // Jeton valide mais compte supprimé depuis : ce n'est pas une panne, c'est
    // simplement une session qui ne correspond plus à rien.
    if (!compte) return NextResponse.json({ profil: null }, { status: 401 });
    return NextResponse.json({ profil: profilPublic(compte) });
  } catch (erreur) {
    console.error("moi", erreur);
    return NextResponse.json({ message: "Service indisponible." }, { status: 503 });
  }
}
