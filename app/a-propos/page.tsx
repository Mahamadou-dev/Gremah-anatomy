import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ContactForm } from "../components/ContactForm";
import { SiteFooter } from "../components/SiteFooter";
import { BRAND, CONTACT_LINKS, DISCLAIMER, SITE_URL } from "../lib/brand";

export const metadata: Metadata = {
  title: "À propos — Gremah Anatomy",
  description: `Gremah Anatomy, un atlas d'anatomie 3D pour les étudiants en médecine du Niger, par ${BRAND.author}. Contact, intentions du projet et avertissement pédagogique.`,
};

/** JSON-LD `Person` : c'est ici que l'auteur est déclaré aux moteurs, pas seulement affiché. */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: BRAND.author,
  email: `mailto:${BRAND.email}`,
  url: BRAND.site,
  sameAs: [BRAND.linkedin, BRAND.site],
  jobTitle: "Concepteur et développeur de Gremah Anatomy",
  worksFor: { "@type": "Organization", name: "Gremah Anatomy", url: SITE_URL },
};

export default function AProposPage() {
  return (
    <main className="app-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className="about-page">
        <Link href="/" className="about-back">
          <ArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>

        <h1>À propos de {BRAND.name}</h1>

        <p className="about-lead">
          Un atlas d&apos;anatomie humaine en 3D, pensé d&apos;abord pour les étudiants en médecine
          du Niger : en français, utilisable sur un smartphone d&apos;entrée de gamme, en connexion
          faible, et consultable hors ligne après la première visite.
        </p>

        <section>
          <h2>Pourquoi ce projet</h2>
          <p>
            Les atlas d&apos;anatomie de référence sont chers, en anglais, et supposent une
            connexion permanente. Gremah Anatomy prend le problème dans l&apos;autre sens : la
            contrainte de départ est un téléphone modeste sur un réseau intermittent, et la langue
            de travail est le français, celle du cursus.
          </p>
          <p>
            L&apos;application est <strong>entièrement frontend</strong> — aucun serveur, aucune
            donnée envoyée nulle part. Votre progression reste sur votre appareil.
          </p>
        </section>

        <section>
          <h2>Comment il est construit</h2>
          <p>
            Le rendu passe par <strong>WebGPU</strong> quand le navigateur le propose et retombe sur
            <strong> WebGL2</strong> sinon, sans qu&apos;aucune fonctionnalité disparaisse en
            silence. Trois profils de qualité — bas, moyen, élevé — sont détectés au premier
            lancement et restent modifiables : le profil bas vise trente images par seconde sur un
            Android d&apos;entrée de gamme.
          </p>
          <p>
            Les modèles ont été ramenés de 28,6 Mo à 7,9 Mo et sont livrés en trois niveaux de
            détail : le plus léger s&apos;affiche d&apos;abord, le raffinement arrive en
            arrière-plan.
          </p>
        </section>

        <section>
          <h2>Contenu et exactitude</h2>
          <p>
            Le français est la langue source, la nomenclature latine suit la{" "}
            <em>Terminologia Anatomica</em>, et chaque affirmation clinique porte une référence
            consultable sur la <Link href="/sources/">page des sources</Link>. Une erreur médicale
            est traitée comme un plantage : si vous en repérez une, le formulaire ci-dessous est le
            meilleur endroit pour la signaler.
          </p>
        </section>

        <section>
          <h2>L&apos;auteur</h2>
          <p>
            {BRAND.name} est conçu et développé par <strong>{BRAND.author}</strong>.
          </p>
          <ul className="about-contacts">
            {CONTACT_LINKS.map((link) => (
              <li key={link.label}>
                <span>{link.label}</span>
                <a
                  href={link.href}
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                >
                  {link.value}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact">
          <h2>Écrire à l&apos;auteur</h2>
          <div className="contact-card">
            <ContactForm />
          </div>
        </section>

        <section>
          <h2>Avertissement</h2>
          <p className="about-disclaimer">{DISCLAIMER}</p>
        </section>

        <Link href="/atlas/" className="btn-primary btn-large about-cta">
          Ouvrir l&apos;atlas <ArrowRight size={16} />
        </Link>
      </div>

      <SiteFooter />
    </main>
  );
}
