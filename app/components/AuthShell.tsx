import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "./AuthForm";
import { ThemeToggle } from "./ThemeToggle";
import { BRAND, DISCLAIMER } from "../lib/brand";

/**
 * Le cadre commun aux deux écrans d'authentification.
 *
 * Deux colonnes : le formulaire à gauche, et à droite un panneau qui rappelle
 * ce qu'on obtient en s'inscrivant. Un formulaire nu, sur un site que le
 * visiteur découvre, ne donne aucune raison de le remplir.
 */
export function AuthShell({
  mode,
  titre,
  intro,
  arguments: points,
}: {
  mode: "connexion" | "inscription";
  titre: string;
  intro: string;
  arguments: readonly string[];
}) {
  return (
    <main className="auth-page">
      <header className="auth-nav">
        <Link href="/" className="landing-mark" aria-label={`${BRAND.name}, accueil`}>
          <span className="landing-mark-sun" aria-hidden="true" />
          <span>
            Gremah <b>Anatomy</b>
          </span>
        </Link>
        <div className="landing-nav-actions">
          <ThemeToggle />
          <Link href="/" className="btn-ghost btn-compact">
            <ArrowLeft size={14} aria-hidden="true" /> Accueil
          </Link>
        </div>
      </header>

      <div className="auth-layout">
        <section className="auth-card">
          <h1>{titre}</h1>
          <p className="auth-intro">{intro}</p>
          {/* `useSearchParams` lit le paramètre `suite` posé par le middleware,
              ce qui impose cette frontière. */}
          <Suspense fallback={<div className="auth-form" aria-busy="true" />}>
            <AuthForm mode={mode} />
          </Suspense>
        </section>

        <aside className="auth-aside">
          <span className="auth-aside-halo" aria-hidden="true" />
          <p className="section-eyebrow">Avec un compte</p>
          <ul>
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="auth-privacy">
            Seuls votre nom, votre email et votre région sont enregistrés — pour savoir d&apos;où
            viennent les étudiants et adapter le contenu. Votre mot de passe n&apos;est jamais
            stocké en clair. Aucune donnée n&apos;est revendue ni partagée.
          </p>
          <p className="auth-disclaimer">{DISCLAIMER}</p>
        </aside>
      </div>
    </main>
  );
}
