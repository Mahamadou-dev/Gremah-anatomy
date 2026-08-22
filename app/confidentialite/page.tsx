import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { BRAND } from "../lib/brand";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Gremah Anatomy",
  description:
    "Ce que Gremah Anatomy stocke sur un compte étudiant, pourquoi, pour combien de temps, et chez qui.",
};

/**
 * Bilingue sur une seule page plutôt que par route : l'infrastructure de
 * routage par langue est le Sprint 15, pas celui-ci. Deux versions complètes
 * valent mieux qu'une promesse de bascule qui n'existe pas encore.
 */
export default function ConfidentialitePage() {
  return (
    <main className="app-shell">
      <div className="about-page">
        <Link href="/" className="about-back">
          <ArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>

        <h1>Politique de confidentialité</h1>
        <p className="about-lead">Dernière mise à jour : 21 août 2026.</p>

        <section>
          <h2>Français</h2>

          <h3>Ce que nous stockons</h3>
          <p>
            La création d&apos;un compte enregistre votre prénom, votre nom, votre adresse email,
            votre pays et votre région, ainsi qu&apos;un mot de passe haché — jamais en clair, par
            <code>scrypt</code>. Rien d&apos;autre n&apos;est collecté : ni traceur, ni cookie
            publicitaire, ni identifiant tiers.
          </p>

          <h3>Pourquoi</h3>
          <p>
            Le pays et la région servent uniquement à mesurer d&apos;où vient l&apos;usage de
            l&apos;atlas ; ils ne sont ni revendus ni partagés. Le compte lui-même n&apos;est jamais
            une condition d&apos;accès au contenu déjà téléchargé — voir CLAUDE.md §2 bis :
            l&apos;anatomie, la 3D et la révision restent utilisables hors ligne sans lui.
          </p>

          <h3>Combien de temps</h3>
          <p>
            Un compte est conservé tant qu&apos;il n&apos;est pas supprimé par son titulaire, depuis
            la page de profil. La suppression est immédiate et définitive, y compris les compteurs
            de sécurité liés à l&apos;adresse email.
          </p>

          <h3>Chez qui</h3>
          <p>
            Les comptes sont hébergés sur <strong>MongoDB Atlas</strong>. Le site tourne sur{" "}
            <strong>Vercel</strong>, qui exécute les quatre routes de compte. Aucun autre
            sous-traitant ne reçoit ces données.
          </p>

          <h3>Cookies</h3>
          <p>
            Un seul cookie est utilisé, strictement nécessaire : la session de connexion (
            <code>httpOnly</code>, signée, jamais lisible par un script de la page). Aucun cookie de
            mesure d&apos;audience ni de publicité.
          </p>

          <h3>Vos droits</h3>
          <p>
            Depuis la page de profil, vous pouvez consulter, modifier, exporter en JSON et supprimer
            votre compte à tout moment. Pour toute autre demande, écrivez à{" "}
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
          </p>
        </section>

        <section>
          <h2>English</h2>

          <h3>What we store</h3>
          <p>
            Creating an account records your first name, last name, email address, country and
            region, plus a hashed password — never stored in clear text, using <code>scrypt</code>.
            Nothing else is collected: no tracker, no advertising cookie, no third-party identifier.
          </p>

          <h3>Why</h3>
          <p>
            Country and region are used only to measure where the atlas is used from; they are never
            sold or shared. The account itself is never a condition for accessing content already
            downloaded — see CLAUDE.md §2 bis: anatomy, 3D, and review stay usable offline without
            it.
          </p>

          <h3>How long</h3>
          <p>
            An account is kept until its owner deletes it, from the profile page. Deletion is
            immediate and permanent, including the security counters tied to the email address.
          </p>

          <h3>Who processes it</h3>
          <p>
            Accounts are hosted on <strong>MongoDB Atlas</strong>. The site runs on{" "}
            <strong>Vercel</strong>, which executes the four account routes. No other processor
            receives this data.
          </p>

          <h3>Cookies</h3>
          <p>
            A single, strictly necessary cookie is used: the login session (<code>httpOnly</code>,
            signed, never readable by a page script). No analytics or advertising cookies.
          </p>

          <h3>Your rights</h3>
          <p>
            From the profile page, you can view, edit, export as JSON, and delete your account at
            any time. For any other request, write to{" "}
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
