import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { BRAND, CONTACT_LINKS, DISCLAIMER } from "../lib/brand";

export const metadata: Metadata = {
  title: "À propos — Gremah Anatomy",
  description: `Gremah Anatomy, un atlas d'anatomie 3D pour les étudiants en médecine du Niger, par ${BRAND.author}.`,
};

export default function AProposPage() {
  return (
    <main className="app-shell">
      <div className="about-page">
        <Link href="/" className="about-back">
          <ArrowLeft size={15} /> Retour à l&apos;atlas
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
            L&apos;application est <strong>entièrement frontend</strong> — aucun serveur, aucun
            compte, aucune donnée envoyée nulle part. Votre progression reste sur votre appareil.
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

        <section>
          <h2>Avertissement</h2>
          <p className="about-disclaimer">{DISCLAIMER}</p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
