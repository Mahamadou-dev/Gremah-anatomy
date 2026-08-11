import { NextResponse } from "next/server";
import { estValide, normaliserEmail, validerConnexion } from "../../lib/compte";
import { comptes, profilPublic } from "../../lib/server/mongo";
import { hacher, verifier } from "../../lib/server/mots-de-passe";
import { COOKIE_SESSION, creerJeton, optionsCookie } from "../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Empreinte factice, dérivée une fois au démarrage de l'instance.
 *
 * Vérifiée quand l'email est inconnu, pour que la réponse mette le même temps
 * que pour un compte existant. Sans elle, un attaquant énumère les comptes
 * inscrits à la simple durée de la réponse — le message d'erreur identique ne
 * suffit pas à masquer ça.
 */
const empreinteLeurre = hacher("compte-inexistant-gremah-anatomy");

export async function POST(request: Request) {
  let saisie: { email?: string; motDePasse?: string };
  try {
    saisie = (await request.json()) as { email?: string; motDePasse?: string };
  } catch {
    return NextResponse.json({ message: "Requête illisible." }, { status: 400 });
  }

  const erreurs = validerConnexion(saisie);
  if (!estValide(erreurs)) {
    return NextResponse.json({ message: "Formulaire incomplet.", erreurs }, { status: 422 });
  }

  const email = normaliserEmail(saisie.email!);

  try {
    const collection = await comptes();
    const compte = await collection.findOne({ email });

    const correct = compte
      ? await verifier(saisie.motDePasse!, compte.motDePasseHache)
      : await verifier(saisie.motDePasse!, await empreinteLeurre);

    if (!compte || !correct) {
      // Un seul message pour « email inconnu » et « mot de passe faux » : dire
      // lequel des deux est en cause offre un outil d'énumération des comptes.
      return NextResponse.json(
        { message: "Adresse email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    await collection.updateOne({ email }, { $set: { derniereConnexion: new Date() } });

    const reponse = NextResponse.json({ profil: profilPublic(compte) });
    reponse.cookies.set(COOKIE_SESSION, await creerJeton(email), optionsCookie());
    return reponse;
  } catch (erreur) {
    console.error("connexion", erreur);
    return NextResponse.json(
      { message: "Le service est momentanément indisponible. Réessayez dans un instant." },
      { status: 503 },
    );
  }
}
