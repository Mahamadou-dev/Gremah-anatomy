import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { DISCLAIMER } from "../lib/brand";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Gremah Anatomy",
  description: "Conditions d'utilisation de l'atlas Gremah Anatomy et de son compte étudiant.",
};

export default function CguPage() {
  return (
    <main className="app-shell">
      <div className="about-page">
        <Link href="/" className="about-back">
          <ArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>

        <h1>Conditions générales d&apos;utilisation</h1>

        <section>
          <h2>Français</h2>
          <h3>Objet</h3>
          <p>
            Gremah Anatomy est un outil pédagogique gratuit d&apos;atlas anatomique 3D. Son usage
            est libre, avec ou sans compte — le compte n&apos;est qu&apos;une commodité, jamais une
            condition d&apos;accès au contenu déjà téléchargé.
          </p>
          <h3>Avertissement pédagogique</h3>
          <p>{DISCLAIMER}</p>
          <h3>Compte étudiant</h3>
          <p>
            L&apos;inscription exige une adresse email valide et un mot de passe d&apos;au moins
            douze caractères. Chaque titulaire est responsable de la confidentialité de son mot de
            passe. Le compte peut être modifié, exporté ou supprimé à tout moment depuis la page de
            profil.
          </p>
          <h3>Licences</h3>
          <p>
            Le code est sous licence MIT. Les modèles 3D dérivés de Z-Anatomy restent sous licence
            CC BY-SA 4.0, comme le détaille la page <Link href="/credits/">Crédits</Link>.
          </p>
          <h3>Évolution</h3>
          <p>
            Ces conditions peuvent évoluer avec le projet ; la date de dernière mise à jour figure
            sur la page <Link href="/confidentialite/">Confidentialité</Link>.
          </p>
        </section>

        <section>
          <h2>English</h2>
          <h3>Purpose</h3>
          <p>
            Gremah Anatomy is a free educational 3D anatomy atlas. It is free to use, with or
            without an account — the account is a convenience only, never a condition for accessing
            content already downloaded.
          </p>
          <h3>Educational disclaimer</h3>
          <p>{DISCLAIMER}</p>
          <h3>Student account</h3>
          <p>
            Registration requires a valid email address and a password of at least twelve
            characters. Each account holder is responsible for keeping their password confidential.
            The account can be edited, exported, or deleted at any time from the profile page.
          </p>
          <h3>Licenses</h3>
          <p>
            The code is MIT-licensed. 3D models derived from Z-Anatomy remain under the CC BY-SA 4.0
            license, as detailed on the <Link href="/credits/">Credits</Link> page.
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
