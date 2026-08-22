import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { estValide, validerModification, type ModificationProfil } from "../../../lib/compte";
import { comptes, profilPublic } from "../../../lib/server/mongo";
import { hacher, verifier } from "../../../lib/server/mots-de-passe";
import { COOKIE_SESSION, lireJeton } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Modification du profil — nom, pays, région, et mot de passe si demandé.
 * L'email n'est pas modifiable ici : c'est la clé du compte, et son changement
 * suppose la vérification d'adresse qui n'existe pas encore (reste du Sprint 13).
 */
export async function POST(request: Request) {
  const session = await lireJeton((await cookies()).get(COOKIE_SESSION)?.value);
  if (!session) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

  let saisie: Partial<ModificationProfil>;
  try {
    saisie = (await request.json()) as Partial<ModificationProfil>;
  } catch {
    return NextResponse.json({ message: "Requête illisible." }, { status: 400 });
  }

  const erreurs = validerModification(saisie, session.email);
  if (!estValide(erreurs)) {
    return NextResponse.json({ message: "Formulaire incomplet.", erreurs }, { status: 422 });
  }

  try {
    const collection = await comptes();
    const compte = await collection.findOne({ email: session.email });
    if (!compte) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const misAJour: Record<string, string> = {
      prenom: saisie.prenom!.trim(),
      nom: saisie.nom!.trim(),
      pays: saisie.pays!.trim(),
      region: saisie.region!.trim(),
    };

    if (saisie.nouveauMotDePasse) {
      const correct = await verifier(saisie.motDePasseActuel!, compte.motDePasseHache);
      if (!correct) {
        return NextResponse.json(
          {
            message: "Mot de passe actuel incorrect.",
            erreurs: { motDePasseActuel: "Mot de passe actuel incorrect." },
          },
          { status: 401 },
        );
      }
      misAJour.motDePasseHache = await hacher(saisie.nouveauMotDePasse);
    }

    await collection.updateOne({ email: compte.email }, { $set: misAJour });
    const relu = await collection.findOne({ email: compte.email });
    return NextResponse.json({ profil: profilPublic(relu!) });
  } catch (erreur) {
    console.error("compte/modifier", erreur);
    return NextResponse.json({ message: "Service indisponible." }, { status: 503 });
  }
}
