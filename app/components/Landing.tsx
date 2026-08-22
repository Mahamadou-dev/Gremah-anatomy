"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Gauge,
  Languages,
  Layers,
  Scan,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { ContactForm } from "./ContactForm";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";
import { useReveal } from "../lib/use-reveal";
import { BRAND, DISCLAIMER } from "../lib/brand";
import { organs } from "../content/organes";
import { SOURCES } from "../content/sources";

/**
 * Le moteur 3D (`HeroCanvas` → `engine/scenes/hero.ts` → three.js entier) pèse
 * l'essentiel du JS de la page d'accueil. Importé statiquement, il était
 * exécuté avant même le premier paint et dominait le TBT/LCP mesurés par
 * Lighthouse sur un CPU de CI partagé (score Performance 0.68). `next/dynamic`
 * avec `ssr:false` sort ce code du bundle initial de `/` : il n'est chargé et
 * exécuté qu'après l'hydratation, une fois le texte et le HTML déjà visibles.
 * Le repli affiché pendant le chargement reprend le poster statique de
 * `HeroCanvas` (halo + libellé) pour qu'il n'y ait aucun saut visuel (CLS).
 */
const HeroCanvas = dynamic(() => import("./HeroCanvas").then((mod) => mod.HeroCanvas), {
  ssr: false,
  loading: () => (
    <div className="hero-canvas" data-ready={false} data-failed={false}>
      <div className="hero-poster" aria-hidden={false}>
        <span className="hero-poster-halo" />
        <span className="hero-poster-label">Préparation de la scène…</span>
      </div>
    </div>
  ),
});

const PILIERS = [
  {
    icon: Cpu,
    title: "Un vrai moteur 3D",
    body: "WebGPU quand le navigateur le propose, WebGL2 sinon — même rendu, aucune fonctionnalité qui disparaît en silence. Matériaux de tissu translucides, rayon X, post-processing.",
  },
  {
    icon: Gauge,
    title: "Trois profils de qualité",
    body: "L'appareil est classé au premier lancement, et vous gardez la main. Le profil « bas » vise 30 images par seconde sur un Android d'entrée de gamme, pas sur un écran de démonstration.",
  },
  {
    icon: Languages,
    title: "Le français comme langue source",
    body: "Pas une traduction d'un atlas anglais : le contenu est écrit en français, avec la nomenclature latine Terminologia Anatomica, et un glossaire haoussa / zarma en chantier.",
  },
  {
    icon: WifiOff,
    title: "Pensé pour une connexion faible",
    body: "Les modèles sont passés de 28,6 Mo à 7,9 Mo, livrés en trois niveaux de détail : le plus léger s'affiche d'abord, le raffinement suit en arrière-plan.",
  },
  {
    icon: Layers,
    title: "Entrer dans l'organe",
    body: "Plans de coupe, écorché par couches, points d'intérêt navigables au clavier. Un atlas ne se contente pas de tourner sur lui-même.",
  },
  {
    icon: ShieldCheck,
    title: "Chaque affirmation sourcée",
    body: "Gray's Anatomy, Netter, Moore, OMS. Aucun fait clinique inventé — en cas de doute, la phrase n'est pas écrite. Une erreur médicale est traitée comme un plantage.",
  },
] as const;

export function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);

  useEffect(() => {
    const copy = heroCopyRef.current;
    if (!copy) return;
    // `matchMedia` plutôt que le signal du moteur : ce texte s'anime avant même
    // que le contexte GPU existe, et doit répondre à la préférence système seul.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.from("[data-hero-step]", {
        y: 22,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.09,
        // Léger retard : l'entrée du texte accompagne l'apparition de l'organe
        // plutôt que de la devancer sur un canvas encore vide.
        delay: 0.15,
      });
    }, copy);

    return () => context.revert();
  }, []);

  return (
    <div className="landing" ref={rootRef}>
      <header className="landing-nav">
        <Link href="/" className="landing-mark" aria-label={`${BRAND.name}, accueil`}>
          <span className="landing-mark-sun" aria-hidden="true" />
          <span>
            Gremah <b>Anatomy</b>
          </span>
        </Link>

        <nav className="landing-nav-links" aria-label="Navigation principale">
          <a href="#pourquoi">Pourquoi</a>
          <a href="#atlas">L&apos;atlas</a>
          <a href="#contact">Contact</a>
          <Link href="/a-propos/">À propos</Link>
        </nav>

        <div className="landing-nav-actions">
          <ThemeToggle />
          <Link href="/connexion/" className="btn-ghost btn-compact">
            Se connecter
          </Link>
          <Link href="/inscription/" className="btn-primary btn-compact">
            Créer un compte <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="hero">
        <HeroCanvas />

        <div className="hero-copy" ref={heroCopyRef}>
          <p className="hero-eyebrow" data-hero-step>
            <Sparkles size={13} aria-hidden="true" />
            Atlas d&apos;anatomie 3D · Niamey
          </p>

          <h1 data-hero-step>
            Le corps humain,
            <br />
            <em>en trois dimensions</em>,<br />
            dans votre poche.
          </h1>

          <p className="hero-lead" data-hero-step>
            Un atlas interactif en français, conçu pour les étudiants en médecine du Niger :
            utilisable sur un smartphone d&apos;entrée de gamme, en connexion faible, et consultable
            hors ligne après la première visite.
          </p>

          <div className="hero-cta" data-hero-step>
            {/* Annoncer la création de compte plutôt que « explorer » : envoyer
                quelqu'un vers l'atlas pour le faire rebondir sur un mur de
                connexion est la meilleure façon de le perdre. */}
            <Link href="/inscription/" className="btn-primary btn-large">
              Créer mon compte gratuit <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a href="#pourquoi" className="btn-ghost btn-large">
              <BookOpen size={16} aria-hidden="true" /> Découvrir le projet
            </a>
          </div>

          <dl className="hero-stats" data-hero-step>
            <div>
              <dt>Structures</dt>
              <dd>{organs.length}</dd>
            </div>
            <div>
              <dt>Poids des modèles</dt>
              <dd>7,9 Mo</dd>
            </div>
            <div>
              <dt>Références</dt>
              <dd>{SOURCES.length}</dd>
            </div>
            <div>
              <dt>Serveur requis</dt>
              <dd>0</dd>
            </div>
          </dl>
        </div>

        <a className="hero-scroll" href="#pourquoi" aria-label="Aller à la section suivante">
          <span aria-hidden="true" />
        </a>
      </section>

      <section id="pourquoi" className="landing-section">
        <div className="section-head" data-reveal>
          <p className="section-eyebrow">Le point de départ</p>
          <h2>
            Les atlas de référence sont chers, en anglais,
            <br />
            et supposent une connexion permanente.
          </h2>
          <p className="section-lead">
            Gremah Anatomy prend le problème dans l&apos;autre sens. La contrainte n&apos;est pas un
            écran de démonstration : c&apos;est un téléphone modeste, sur un réseau intermittent,
            avec un forfait compté au mégaoctet. Tout le reste découle de là.
          </p>
        </div>

        <div className="pillar-grid">
          {PILIERS.map((pilier, index) => (
            <article
              key={pilier.title}
              className="pillar"
              data-reveal
              style={{ "--reveal-delay": `${index * 60}ms` } as React.CSSProperties}
            >
              <span className="pillar-icon" aria-hidden="true">
                <pilier.icon size={19} />
              </span>
              <h3>{pilier.title}</h3>
              <p>{pilier.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="atlas" className="landing-section landing-section-alt">
        <div className="section-head" data-reveal>
          <p className="section-eyebrow">L&apos;atlas</p>
          <h2>Ce que vous pouvez faire dès maintenant</h2>
        </div>

        <div className="organ-strip" data-reveal>
          {organs.map((organ) => (
            <Link
              key={organ.id}
              href={`/atlas/?organe=${organ.id}`}
              className="organ-tile"
              style={{ "--tile-accent": organ.accent } as React.CSSProperties}
            >
              {organ.illustrated ? (
                <img
                  src={`/anatomy/${organ.id}/thumb.webp`}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="organ-tile-glyph" aria-hidden="true">
                  {organ.icon}
                </span>
              )}
              <strong>{organ.name}</strong>
              <small>{organ.system}</small>
            </Link>
          ))}
        </div>

        <div className="atlas-callout" data-reveal>
          <Scan size={18} aria-hidden="true" />
          <p>
            Faites tourner un organe, ouvrez-le en coupe, suivez les points d&apos;intérêt au
            clavier, lisez la fiche sourcée en français — puis coupez la connexion : tout reste
            consultable.
          </p>
          <Link href="/inscription/" className="btn-primary">
            Commencer <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section id="contact" className="landing-section">
        <div className="contact-layout">
          <div className="contact-intro" data-reveal>
            <p className="section-eyebrow">Contact</p>
            <h2>Une question, une erreur repérée, une contribution&nbsp;?</h2>
            <p className="section-lead">
              Le projet est conçu et développé par <strong>{BRAND.author}</strong>. Les retours
              d&apos;étudiants et d&apos;enseignants sont ce qui le fait avancer — signaler une
              imprécision anatomique est la contribution la plus utile qui soit.
            </p>
            <p className="contact-note">{DISCLAIMER}</p>
          </div>

          <div className="contact-card" data-reveal>
            <ContactForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
