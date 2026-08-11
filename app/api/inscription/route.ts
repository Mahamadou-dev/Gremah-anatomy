import { NextResponse } from "next/server";
import { estValide, normaliserEmail, validerInscription, type Inscription } from "../../lib/compte";
import { comptes, profilPublic, type DocumentCompte } from "../../lib/server/mongo";
import { hacher } from "../../lib/server/mots-de-passe";
import { COOKIE_SESSION, creerJeton, optionsCookie } from "../../lib/server/session";

// Le driver Mongo et `node:crypto` exigent le runtime Node : le runtime Edge
// n'a ni sockets TCP ni scrypt.
export const runtime = "nodejs";
// Rien à prérendre : la route lit un corps de requête et écrit en base.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let saisie: Partial<Inscription>;
  try {
    saisie = (await request.json()) as Partial<Inscription>;
  } catch {
    return NextResponse.json({ message: "Requête illisible." }, { status: 400 });
  }

  // Revalidation intégrale côté serveur : la validation du formulaire est un
  // confort d'ergonomie, elle ne prouve rien — n'importe qui peut poster ici.
  const erreurs = validerInscription(saisie);
  if (!estValide(erreurs)) {
    return NextResponse.json({ message: "Formulaire incomplet.", erreurs }, { status: 422 });
  }

  const email = normaliserEmail(saisie.email!);
  const document: DocumentCompte = {
    email,
    prenom: saisie.prenom!.trim(),
    nom: saisie.nom!.trim(),
    pays: saisie.pays!.trim(),
    region: saisie.region!.trim(),
    motDePasseHache: await hacher(saisie.motDePasse!),
    creeLe: new Date(),
    derniereConnexion: new Date(),
  };

  try {
    await (await comptes()).insertOne(document);
  } catch (erreur) {
    // 11000 = violation d'index unique. C'est l'index qui tranche, pas un
    // `findOne` préalable : deux inscriptions simultanées passeraient toutes
    // les deux une vérification faite avant l'écriture.
    if ((erreur as { code?: number }).code === 11000) {
      return NextResponse.json(
        {
          message: "Un compte existe déjà avec cette adresse.",
          erreurs: { email: "Cette adresse est déjà inscrite." },
        },
        { status: 409 },
      );
    }
    console.error("inscription", erreur);
    return NextResponse.json(
      { message: "Le service est momentanément indisponible. Réessayez dans un instant." },
      { status: 503 },
    );
  }

  // Inscription réussie = session ouverte. Redemander de se connecter juste
  // après avoir créé le compte est une friction que rien ne justifie.
  const reponse = NextResponse.json({ profil: profilPublic(document) }, { status: 201 });
  reponse.cookies.set(COOKIE_SESSION, await creerJeton(email), optionsCookie());
  return reponse;
}
