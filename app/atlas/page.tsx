import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasEntry } from "./AtlasEntry";

export const metadata: Metadata = {
  title: "L'atlas — Gremah Anatomy",
  description:
    "Explorez le cœur, l'encéphale, les poumons, le foie, les reins, l'œil, l'intestin, le pancréas et la peau en 3D : coupes, points d'intérêt et fiches sourcées en français.",
};

export default function AtlasPage() {
  return (
    // `useSearchParams` impose une frontière Suspense en export statique. Le
    // repli reste volontairement muet : l'atlas monte en quelques millisecondes,
    // et un écran de chargement qui clignote coûte plus qu'il ne rassure.
    <Suspense fallback={<main className="app-shell" aria-busy="true" />}>
      <AtlasEntry />
    </Suspense>
  );
}
