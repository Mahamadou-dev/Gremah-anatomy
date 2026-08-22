import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { comptes } from "../../../lib/server/mongo";
import { COOKIE_SESSION, lireJeton } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Export du profil en JSON — le droit d'accès de CLAUDE.md §2 bis, réglé en
 * peu de code. Jamais le hachage du mot de passe : ce n'est pas une donnée que
 * l'étudiant a besoin de récupérer, seulement une qu'il a le droit de changer.
 */
export async function GET() {
  const session = await lireJeton((await cookies()).get(COOKIE_SESSION)?.value);
  if (!session) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

  try {
    const compte = await (await comptes()).findOne({ email: session.email });
    if (!compte) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const donnees = {
      prenom: compte.prenom,
      nom: compte.nom,
      email: compte.email,
      pays: compte.pays,
      region: compte.region,
      creeLe: compte.creeLe,
      derniereConnexion: compte.derniereConnexion,
    };

    return new NextResponse(JSON.stringify(donnees, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="gremah-anatomy-mes-donnees.json"',
      },
    });
  } catch (erreur) {
    console.error("compte/exporter", erreur);
    return NextResponse.json({ message: "Service indisponible." }, { status: 503 });
  }
}
