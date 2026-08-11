import { NextResponse } from "next/server";
import { COOKIE_SESSION } from "../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST et non GET : une déconnexion est une action. En GET, un `<img src>` posé
 * sur n'importe quelle page déconnecterait l'étudiant à son insu.
 */
export async function POST() {
  const reponse = NextResponse.json({ ok: true });
  // Aucune session n'est stockée côté serveur : effacer le cookie suffit à
  // rendre le jeton inutilisable depuis ce navigateur.
  reponse.cookies.delete(COOKIE_SESSION);
  return reponse;
}
