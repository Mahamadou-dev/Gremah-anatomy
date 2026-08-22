import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ProfileForm } from "../components/ProfileForm";
import { ThemeToggle } from "../components/ThemeToggle";
import { BRAND } from "../lib/brand";

export const metadata: Metadata = {
  title: "Mon profil — Gremah Anatomy",
  description: "Gérer, exporter ou supprimer votre compte Gremah Anatomy.",
  robots: { index: false, follow: false },
};

export default function ProfilPage() {
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
          <Link href="/atlas/" className="btn-ghost btn-compact">
            <ArrowLeft size={14} aria-hidden="true" /> Atlas
          </Link>
        </div>
      </header>

      <Suspense fallback={<div className="auth-form" aria-busy="true" />}>
        <ProfileForm />
      </Suspense>
    </main>
  );
}
