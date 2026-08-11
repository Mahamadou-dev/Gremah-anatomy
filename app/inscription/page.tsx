import type { Metadata } from "next";
import { AuthShell } from "../components/AuthShell";

export const metadata: Metadata = {
  title: "Créer un compte — Gremah Anatomy",
  description: "Créez votre compte étudiant et ouvrez l'atlas d'anatomie 3D en français.",
  robots: { index: false, follow: false },
};

export default function InscriptionPage() {
  return (
    <AuthShell
      mode="inscription"
      titre="Créer votre compte"
      intro="Quelques informations, et l'atlas s'ouvre. Gratuit, et il le restera pour les étudiants."
      arguments={[
        "L'atlas 3D complet, utilisable sur un téléphone d'entrée de gamme.",
        "Contenu en français, nomenclature latine, chaque affirmation sourcée.",
        "Votre région nous dit où le projet est utilisé — et ce qu'il doit couvrir en priorité.",
      ]}
    />
  );
}
