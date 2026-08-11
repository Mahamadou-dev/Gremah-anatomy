"use client";

import { useSearchParams } from "next/navigation";
import { AnatomyApp } from "../components/AnatomyApp";
import { organById, type OrganId } from "../content/organes";

/**
 * Point d'entrée du deep-link `?organe=heart`.
 *
 * C'est ce qui permet à l'accueil — et à un lien partagé entre étudiants —
 * d'ouvrir directement la bonne fiche. En export statique, l'URL n'existe qu'au
 * runtime : `useSearchParams` la lit côté client, sous la frontière `<Suspense>`
 * posée par la page. L'organe n'est lu qu'au montage et devient ensuite un état
 * local ordinaire, pour que la navigation dans l'atlas ne repasse pas par l'URL.
 */
export function AtlasEntry() {
  const requested = useSearchParams().get("organe");
  const initial = requested && requested in organById ? (requested as OrganId) : "heart";
  return <AnatomyApp initialOrgan={initial} />;
}
