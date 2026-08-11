import type { Metadata } from "next";
import { AuthShell } from "../components/AuthShell";

export const metadata: Metadata = {
  title: "Se connecter — Gremah Anatomy",
  description: "Accédez à votre atlas d'anatomie 3D en français.",
  // Les écrans de compte n'ont rien à faire dans un index de recherche.
  robots: { index: false, follow: false },
};

export default function ConnexionPage() {
  return (
    <AuthShell
      mode="connexion"
      titre="Content de vous revoir"
      intro="Connectez-vous pour reprendre votre exploration là où vous l'aviez laissée."
      arguments={[
        "L'atlas 3D complet : coupes, points d'intérêt, fiches sourcées en français.",
        "Votre progression et vos annotations, retrouvées sur chaque appareil.",
        "Les nouveaux organes et systèmes dès leur publication.",
      ]}
    />
  );
}
