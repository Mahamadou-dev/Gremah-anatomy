"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { ProfilPublic } from "../lib/compte";

/**
 * Qui est connecté, et par où sortir.
 *
 * Le profil est demandé au montage plutôt que passé en props : l'atlas est un
 * composant client monté sous une frontière Suspense, et le faire dépendre
 * d'une lecture serveur transformerait toute la page en rendu dynamique pour
 * afficher un prénom.
 *
 * Tant que la réponse n'est pas là, le composant ne rend rien — un squelette
 * de deux mots clignotant dans une barre d'outils coûte plus qu'il n'apporte.
 */
export function AccountBadge() {
  const router = useRouter();
  const [profil, setProfil] = useState<ProfilPublic | null>(null);
  const [sortie, setSortie] = useState(false);

  useEffect(() => {
    const abandon = new AbortController();
    fetch("/api/moi", { signal: abandon.signal })
      .then((reponse) => (reponse.ok ? reponse.json() : null))
      .then((corps: { profil?: ProfilPublic } | null) => setProfil(corps?.profil ?? null))
      .catch(() => {
        // Réseau coupé : l'atlas reste consultable, seule l'identité manque.
        // Ne rien afficher est plus honnête qu'un prénom peut-être périmé.
      });
    return () => abandon.abort();
  }, []);

  async function seDeconnecter() {
    setSortie(true);
    try {
      await fetch("/api/deconnexion", { method: "POST" });
    } finally {
      // `refresh` avant `push` : sans ça le middleware relit la page depuis le
      // cache du routeur, avec un cookie qui n'existe plus.
      router.refresh();
      router.push("/");
    }
  }

  if (!profil) return null;

  return (
    <p className="account-badge">
      <span>Bonjour</span> <b>{profil.prenom}</b>
      <button
        type="button"
        onClick={seDeconnecter}
        disabled={sortie}
        aria-label="Se déconnecter"
        title="Se déconnecter"
      >
        <LogOut size={14} aria-hidden="true" />
      </button>
    </p>
  );
}
