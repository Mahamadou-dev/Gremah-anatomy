import type { NextConfig } from "next";

/**
 * Gremah Anatomy est 100 % frontend : l'export statique garantit qu'aucun
 * serveur n'est requis au runtime, et que le site reste déployable partout
 * (Vercel, GitHub Pages, ou une clé USB pour une salle de TP hors ligne).
 */
const nextConfig: NextConfig = {
  output: "export",
  // Pas d'optimiseur d'images côté serveur en export statique : les assets
  // anatomiques sont déjà livrés en .webp pré-dimensionnés.
  images: { unoptimized: true },
  // Des URLs en dossier évitent les 404 sur les hôtes statiques qui ne
  // réécrivent pas `/a-propos` vers `/a-propos.html`.
  trailingSlash: true,
};

export default nextConfig;
