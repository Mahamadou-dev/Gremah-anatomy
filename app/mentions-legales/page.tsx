import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { BRAND, CONTACT_LINKS } from "../lib/brand";

export const metadata: Metadata = {
  title: "Mentions légales — Gremah Anatomy",
  description: "Éditeur, hébergement et contact de Gremah Anatomy.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="app-shell">
      <div className="about-page">
        <Link href="/" className="about-back">
          <ArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>

        <h1>Mentions légales</h1>

        <section>
          <h2>Français</h2>
          <h3>Éditeur</h3>
          <p>
            {BRAND.name} est édité par {BRAND.author}, à titre individuel, depuis le Niger. Contact
            : <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
          </p>
          <h3>Hébergement</h3>
          <p>
            Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA
            91789, États-Unis. Les comptes étudiants sont stockés par <strong>MongoDB Atlas</strong>{" "}
            (MongoDB, Inc.).
          </p>
          <h3>Propriété intellectuelle</h3>
          <p>
            Le code du dépôt est sous licence MIT. Les modèles 3D dérivent de BodyParts3D (CC BY-SA
            2.1 Japon) via Z-Anatomy (CC BY-SA 4.0) — voir la page{" "}
            <Link href="/credits/">Crédits</Link> pour l&apos;attribution complète, structure par
            structure.
          </p>
          <h3>Contact</h3>
          <ul className="legal-contacts">
            {CONTACT_LINKS.map((link) => (
              <li key={link.label}>
                {link.label} : <a href={link.href}>{link.value}</a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>English</h2>
          <h3>Publisher</h3>
          <p>
            {BRAND.name} is published by {BRAND.author}, as an individual, from Niger. Contact:{" "}
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
          </p>
          <h3>Hosting</h3>
          <p>
            The site is hosted by <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA
            91789, USA. Student accounts are stored by <strong>MongoDB Atlas</strong> (MongoDB,
            Inc.).
          </p>
          <h3>Intellectual property</h3>
          <p>
            The repository&apos;s code is MIT-licensed. 3D models derive from BodyParts3D (CC BY-SA
            2.1 Japan) via Z-Anatomy (CC BY-SA 4.0) — see the <Link href="/credits/">Credits</Link>{" "}
            page for full, per-structure attribution.
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
