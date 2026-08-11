import type { NextConfig } from "next";

/**
 * Gremah Anatomy reste un site statique — à une exception près, assumée.
 *
 * L'export statique (`output: "export"`) a été retiré pour laisser passer les
 * quatre routes `app/api/` de l'authentification. Un navigateur ne peut pas
 * joindre MongoDB Atlas directement — le driver parle un protocole binaire sur
 * TCP, la Data API d'Atlas a été retirée en septembre 2025, et un identifiant de
 * cluster dans un bundle client serait public. Il faut donc un intermédiaire,
 * et ces quatre fonctions sont le plus petit qui existe.
 *
 * Ce que cela change concrètement :
 *   - toutes les pages restent prérendues en statique au build ;
 *   - l'atlas, les modèles et les images continuent d'être servis en fichiers ;
 *   - seules l'inscription, la connexion et la lecture du profil touchent le réseau ;
 *   - en revanche, le déploiement sur un hôte purement statique (GitHub Pages,
 *     clé USB pour une salle de TP) ne porterait plus les comptes. Le reste du
 *     site y fonctionnerait toujours.
 */
const nextConfig: NextConfig = {
  // Pas d'optimiseur d'images côté serveur : les assets anatomiques sont déjà
  // livrés en .webp pré-dimensionnés, et l'optimiseur se facturerait pour rien.
  images: { unoptimized: true },
  // Des URLs en dossier : les liens déjà partagés (`/a-propos/`) restent valides,
  // et le jour où l'on revient à un export statique, rien ne casse.
  trailingSlash: true,
};

export default nextConfig;
