"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CircleHelp,
  Compass,
  FileText,
  Heart,
  LibraryBig,
  Microscope,
  Play,
  Search,
  Share2,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
// Fonction pure de dérivation d'URL : aucun objet three ne traverse la frontière.
import { lodUrl, PREVIEW_LEVEL } from "../engine/loaders/lod";
import { OrganViewer } from "./OrganViewer";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";
import { organById, organs, type Organ, type OrganId } from "../content/organes";
import { AVERTISSEMENT, SOURCE_BY_ID } from "../content/sources";

type Modal = "lesson" | "quiz" | "animation" | "system" | null;

/**
 * Renders an organ illustration, or its accent glyph for organs that ship as a
 * 3D model without the painted asset set. Keeps every image slot filled instead
 * of leaving a broken `<img>` behind.
 */
function OrganArt({
  organ,
  asset,
  alt,
  size,
}: {
  organ: Organ;
  asset: "thumb" | "organ" | "microscopic" | "compare" | "location";
  alt: string;
  size?: number;
}) {
  if (!organ.illustrated) {
    // An empty alt means a surrounding control already names this, so the
    // glyph should be skipped rather than announced with no label.
    const labelling = alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true };
    return (
      <span
        className="art-fallback"
        style={{ "--art-accent": organ.accent } as React.CSSProperties}
        {...labelling}
      >
        {organ.icon}
      </span>
    );
  }
  return (
    <img
      key={`${organ.id}-${asset}`}
      src={`/anatomy/${organ.id}/${asset}.webp`}
      alt={alt}
      width={size}
      height={size}
      loading={asset === "thumb" ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function AnatomyApp({ initialOrgan = "heart" }: { initialOrgan?: OrganId }) {
  const [organId, setOrganId] = useState<OrganId>(initialOrgan);
  const [autoRotate, setAutoRotate] = useState(true);
  const [compare, setCompare] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [query, setQuery] = useState("");
  const [mobileLibrary, setMobileLibrary] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefetched = useRef(new Set<OrganId>());
  const organ = organById[organId];
  const reference = organById[organId === "heart" ? "brain" : "heart"];
  const filteredOrgans = useMemo(
    () =>
      organs.filter((item) =>
        `${item.name} ${item.system}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current.querySelectorAll("[data-reveal]"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.48, stagger: 0.035, ease: "power2.out", overwrite: true },
    );
  }, [organId]);

  const selectOrgan = (id: OrganId) => {
    if (organById[id].illustrated) {
      ["organ", "microscopic", "compare", "location"].forEach((asset) => {
        const image = new Image();
        image.src = `/anatomy/${id}/${asset}.webp`;
      });
    }
    setOrganId(id);
    setMobileLibrary(false);
    setCompare(false);
  };

  // Réchauffe le cache HTTP pendant que le pointeur est encore en route, pour que
  // le changement d'organe se fasse sans passe de chargement visible.
  // On ne préfetch que le niveau d'aperçu (~150 Ko) : spéculer sur le niveau plein
  // engagerait plus d'un mégaoctet du forfait de l'étudiant pour un survol.
  const prefetchOrgan = (id: OrganId) => {
    if (id === organId || prefetched.current.has(id)) return;
    prefetched.current.add(id);
    const url = lodUrl(organById[id].model, PREVIEW_LEVEL);
    void fetch(url, { priority: "low" } as RequestInit).catch(() => {});
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        {/* La marque ramène à l'accueil et non à l'organe par défaut : dans une
            barre de navigation, un logo qui ne sort pas de la page en cours est
            un piège que tout le monde tombe dedans une fois. */}
        <Link href="/" className="brand" aria-label="Gremah Anatomy — accueil">
          <strong>
            Gremah Anatomy<sup>☀</sup>
          </strong>
          <em>L&apos;anatomie en 3D, pour les étudiants du Niger</em>
        </Link>
        {/* Navigation réduite à ce qui existe réellement. Cinq onglets dont quatre
            morts, c'est plus déroutant qu'une barre courte : un étudiant qui clique
            dans le vide cesse de faire confiance au reste de l'interface. */}
        <nav className="main-nav" aria-label="Navigation principale">
          <a className="active" href="#atlas">
            <Compass size={17} /> Atlas
          </a>
          <a href="/sources/">
            <BookOpen size={17} /> Sources
          </a>
          <a href="/a-propos/">
            <Compass size={17} /> À propos
          </a>
        </nav>
        <label className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un organe, un système…"
            aria-label="Rechercher un organe ou un système"
          />
        </label>
        <ThemeToggle />
        <button
          className="mobile-library-trigger"
          onClick={() => setMobileLibrary(true)}
          aria-label="Ouvrir la liste des organes"
        >
          <LibraryBig size={20} />
        </button>
      </header>

      <div className="workspace">
        <aside className={`organ-library ${mobileLibrary ? "open" : ""}`}>
          <div className="panel-heading">
            <span>Organes</span>
            <button
              aria-label="Fermer la liste"
              className="mobile-close"
              onClick={() => setMobileLibrary(false)}
            >
              <X size={17} />
            </button>
          </div>
          <div className="organ-list">
            {filteredOrgans.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`organ-item ${organId === item.id ? "active" : ""}`}
                onClick={() => selectOrgan(item.id)}
                onPointerEnter={() => prefetchOrgan(item.id)}
                onFocus={() => prefetchOrgan(item.id)}
                style={{ "--item-accent": item.accent } as React.CSSProperties}
              >
                <span className="organ-glyph">
                  <OrganArt organ={item} asset="thumb" alt={`${item.name} thumbnail`} size={47} />
                </span>
                <span>
                  <b>{item.name}</b>
                  <small>{item.system}</small>
                </span>
                {organId === item.id && (
                  <Heart className="favorite" size={14} fill="currentColor" />
                )}
              </button>
            ))}
            {filteredOrgans.length === 0 && (
              <p className="empty-search">Aucun organe ne correspond à « {query} ».</p>
            )}
          </div>
          {query && (
            <button className="view-all" onClick={() => setQuery("")}>
              Voir tous les organes <ArrowRight size={14} />
            </button>
          )}
          {/* Avertissement pédagogique exigé par CLAUDE.md §8 : il doit être visible
              là où le contenu médical est consulté, pas relégué au pied de page. */}
          <blockquote className="disclaimer">
            <Sparkles size={18} />
            <p>{AVERTISSEMENT}</p>
            <a href="/sources/">Voir les sources</a>
          </blockquote>
        </aside>

        <OrganViewer
          organ={organ}
          autoRotate={autoRotate}
          onAutoRotate={setAutoRotate}
          compare={compare}
          onCompare={() => setCompare(!compare)}
        />

        <aside className="info-panel" ref={contentRef}>
          <div className="info-kicker" data-reveal>
            <Heart size={13} fill="currentColor" /> {organ.system}
          </div>
          <div className="info-title-row" data-reveal>
            <div>
              <h1>{organ.name}</h1>
              {/* Nomenclature : latin de la Terminologia Anatomica, puis anglais
                  pour retrouver la littérature internationale. */}
              <p className="nomenclature">
                <i>{organ.latin}</i>
                <span>·</span>
                {organ.english}
                {organ.vernaculaire?.hausa && (
                  <>
                    <span>·</span>
                    <abbr title="Hausa">ha.</abbr> {organ.vernaculaire.hausa}
                  </>
                )}
              </p>
              <em>{organ.poetic}</em>
            </div>
            <span className="specimen-stamp">
              <OrganArt
                organ={organ}
                asset="organ"
                alt={`${organ.name} anatomical illustration`}
                size={92}
              />
            </span>
          </div>
          <p className="description" data-reveal>
            {organ.description}
          </p>
          <div className="rule" />
          <h2 data-reveal>Repères anatomiques</h2>
          <dl className="key-facts">
            <div data-reveal>
              <dt>
                <span>◇</span> Dimensions
              </dt>
              <dd>{organ.taille}</dd>
            </div>
            <div data-reveal>
              <dt>
                <span>♙</span> Poids
              </dt>
              <dd>{organ.poids}</dd>
            </div>
            <div data-reveal>
              <dt>
                <span>⌖</span> Situation
              </dt>
              <dd>{organ.situation}</dd>
            </div>
            <div data-reveal>
              <dt>
                <span>◈</span> Fonction
              </dt>
              <dd>{organ.fonction}</dd>
            </div>
            <div data-reveal>
              <dt>
                <span>❋</span> Vascularisation
              </dt>
              <dd>{organ.vascularisation}</dd>
            </div>
            <div data-reveal>
              <dt>
                <span>⌁</span> Innervation
              </dt>
              <dd>{organ.innervation}</dd>
            </div>
            <div data-reveal>
              <dt>
                <span>⌥</span> Drainage
              </dt>
              <dd>{organ.drainage}</dd>
            </div>
          </dl>

          <div className="rule" />
          <h2 data-reveal>Histologie</h2>
          <p className="description" data-reveal>
            {organ.histologie}
          </p>

          <div className="rule" />
          <h2 data-reveal>Physiologie</h2>
          <ul className="physiologie" data-reveal>
            {organ.physiologie.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="rule" />
          <h2 data-reveal>Rapports anatomiques</h2>
          <p className="description" data-reveal>
            {organ.rapports}
          </p>

          <div className="rule" />
          <h2 data-reveal>Corrélations cliniques</h2>
          {organ.clinique.map((fait) => (
            <div className="medical-note" data-reveal key={fait.titre}>
              <Stethoscope size={16} />
              <p>
                <b>{fait.titre}</b>
                {fait.texte}
                {/* La source accompagne l'affirmation, pas une bibliographie
                    lointaine : c'est la règle du §8 rendue visible. */}
                <cite>{SOURCE_BY_ID.get(fait.source)?.citation ?? fait.source}</cite>
              </p>
            </div>
          ))}

          {organ.ancrageNiger && (
            <div className="niger-note" data-reveal>
              <FileText size={16} />
              <p>
                <span className="niger-tag">Contexte nigérien</span>
                <b>{organ.ancrageNiger.titre}</b>
                {organ.ancrageNiger.texte}
                <cite>
                  {SOURCE_BY_ID.get(organ.ancrageNiger.source)?.citation ??
                    organ.ancrageNiger.source}
                </cite>
              </p>
            </div>
          )}

          <div className="fun-note" data-reveal>
            <Sparkles size={15} />
            <p>
              <b>Le saviez-vous</b>
              {organ.leSaviezVous}
            </p>
          </div>

          <div className="action-grid" data-reveal>
            <button onClick={() => setModal("animation")}>
              <Play size={15} /> Animer
            </button>
            <button onClick={() => setModal("quiz")}>
              <CircleHelp size={15} /> Quiz
            </button>
            <button onClick={() => setCompare(!compare)} className={compare ? "active" : ""}>
              <Share2 size={15} /> Comparer
            </button>
          </div>
        </aside>
      </div>

      {compare && (
        <section className="compare-strip" aria-label="Comparaison d'organes">
          <div className="compare-organ">
            <OrganArt organ={organ} asset="thumb" alt="" />
            <span>Organe étudié</span>
            <strong>{organ.name}</strong>
            <small>{organ.system}</small>
          </div>
          <b>vs</b>
          <div className="compare-organ">
            <OrganArt organ={reference} asset="thumb" alt="" />
            <span>Référence</span>
            <strong>{reference.name}</strong>
            <small>{reference.system}</small>
          </div>
          <dl>
            <div>
              <dt>Rôle principal</dt>
              <dd>{organ.fonction}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>{organ.taille}</dd>
            </div>
          </dl>
          <button onClick={() => setCompare(false)} aria-label="Fermer la comparaison">
            <X size={16} />
          </button>
        </section>
      )}

      <section className="learning-cards" aria-label={`Ressources sur : ${organ.name}`}>
        <article className="curiosity-card">
          <span>✿</span>
          <p>
            Apprendre,
            <br />
            c&apos;est d&apos;abord observer.
          </p>
          <em>Faites tourner le modèle.</em>
        </article>
        <article>
          <header>
            <div>
              <em>Vue microscopique</em>
              <h3>Histologie</h3>
            </div>
            <Microscope size={17} />
          </header>
          <div className="microscope-visual organ-card-image">
            <OrganArt
              organ={organ}
              asset="microscopic"
              alt={`Coupe histologique : ${organ.name}`}
            />
          </div>
          <button onClick={() => setModal("lesson")}>
            Explorer le tissu <ArrowRight size={14} />
          </button>
        </article>
        <article>
          <header>
            <div>
              <em>Comparer</em>
              <h3>
                {organ.name} et {reference.name}
              </h3>
            </div>
            <Share2 size={17} />
          </header>
          <div className="comparison-visual organ-card-image">
            <OrganArt
              organ={organ}
              asset="compare"
              alt={`Comparaison anatomique : ${organ.name}`}
            />
          </div>
          <button onClick={() => setCompare(true)}>
            Ouvrir la comparaison <ArrowRight size={14} />
          </button>
        </article>
        <article>
          <header>
            <div>
              <em>Fonction</em>
              <h3>{organ.fonction}</h3>
            </div>
            <Play size={17} />
          </header>
          {/* L'illustration est elle-même le contrôle : le badge de lecture qu'elle
              contient est décoratif, et non un bouton imbriqué. */}
          <button
            type="button"
            className="function-visual organ-card-image"
            onClick={() => setModal("animation")}
            aria-label={`Lancer l'animation de la fonction : ${organ.name}`}
          >
            <OrganArt organ={organ} asset="organ" alt="" />
            <i className="function-pulse" />
            <span className="play-badge">
              <Play size={18} fill="currentColor" />
            </span>
          </button>
          <button onClick={() => setModal("animation")}>
            Lancer l&apos;animation <ArrowRight size={14} />
          </button>
        </article>
        <article>
          <header>
            <div>
              <em>Notes cliniques</em>
              <h3>Pathologies fréquentes</h3>
            </div>
            <FileText size={17} />
          </header>
          <ul>
            {organ.pathologies.map((pathologie) => (
              <li key={pathologie}>{pathologie}</li>
            ))}
          </ul>
          <a className="card-link" href="/sources/">
            Voir les sources <ArrowRight size={14} />
          </a>
        </article>
        <article className="system-card">
          <header>
            <div>
              <em>Situation</em>
              <h3>{organ.system}</h3>
            </div>
            <BrainCircuit size={17} />
          </header>
          <button
            type="button"
            className="system-visual organ-card-image"
            onClick={() => setModal("system")}
            aria-label={`Situer : ${organ.name} dans le corps`}
          >
            <OrganArt organ={organ} asset="location" alt="" />
          </button>
          <button onClick={() => setModal("system")}>
            Situer dans le corps <ArrowRight size={14} />
          </button>
        </article>
      </section>

      {modal && <LearningModal type={modal} organ={organ} onClose={() => setModal(null)} />}
      {mobileLibrary && (
        <button
          className="drawer-backdrop"
          aria-label="Fermer la liste"
          onClick={() => setMobileLibrary(false)}
        />
      )}

      <SiteFooter />
    </main>
  );
}

const MODAL_ICON: Record<Exclude<Modal, null>, string> = {
  quiz: "?",
  animation: "▶",
  system: "⌖",
  lesson: "✦",
};

function LearningModal({
  type,
  organ,
  onClose,
}: {
  type: Exclude<Modal, null>;
  organ: Organ;
  onClose: () => void;
}) {
  const organName = organ.name;
  const title =
    type === "quiz"
      ? `Quiz — ${organName}`
      : type === "animation"
        ? `${organName} en mouvement`
        : type === "system"
          ? `${organName} : situation dans le corps`
          : `À l'intérieur : ${organName}`;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`learning-modal ${type === "system" ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X size={18} />
        </button>
        <span className="modal-icon">{MODAL_ICON[type]}</span>
        <em>Étude guidée</em>
        <h2 id="modal-title">{title}</h2>
        {type === "quiz" ? (
          <StructureQuiz organ={organ} />
        ) : type === "system" ? (
          <>
            <p>{organ.situation}.</p>
            {/* Montrée entière plutôt que recadrée dans le médaillon : l'intérêt de
                cette vue est justement la figure et ses rapports. */}
            <figure className="modal-figure">
              <OrganArt
                organ={organ}
                asset="location"
                alt={`${organName} situé dans le corps — ${organ.system}`}
              />
            </figure>
            <dl className="modal-facts">
              <div>
                <dt>Système</dt>
                <dd>{organ.system}</dd>
              </div>
              <div>
                <dt>Rapports</dt>
                <dd>{organ.rapports}</dd>
              </div>
              <div>
                <dt>Vascularisation</dt>
                <dd>{organ.vascularisation}</dd>
              </div>
            </dl>
            <button className="lesson-button" onClick={onClose}>
              Continuer l&apos;exploration <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <p>{organ.histologie}</p>
            <div className={`modal-demo ${type === "animation" ? "moving" : ""}`}>
              <OrganArt organ={organ} asset="organ" alt={`Illustration : ${organName}`} />
            </div>
            <button className="lesson-button" onClick={onClose}>
              Continuer l&apos;exploration <ArrowRight size={16} />
            </button>
          </>
        )}
      </section>
    </div>
  );
}

/**
 * Quiz d'identification, construit à partir des points d'intérêt de l'organe.
 *
 * Les questions ne sont pas écrites à la main : elles sont dérivées du contenu
 * déjà sourcé. Une question inventée serait une affirmation médicale sans source,
 * et donc un bug bloquant au sens du §8.
 */
function StructureQuiz({ organ }: { organ: Organ }) {
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);

  const questions = useMemo(
    () =>
      organ.hotspots.map((cible) => ({
        enonce: cible.detail,
        bonneReponse: cible.label,
        // Les distracteurs viennent du même organe : ils sont plausibles, donc la
        // question teste vraiment la connaissance et non le bon sens.
        options: [...organ.hotspots]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((point) => point.label),
      })),
    [organ],
  );

  if (!questions.length) return <p>Aucun point d&apos;intérêt n&apos;est encore défini ici.</p>;
  const question = questions[Math.min(index, questions.length - 1)];
  const termine = index >= questions.length - 1 && answered !== null;

  return (
    <div className="quiz-options">
      <p>
        <b>
          Question {Math.min(index + 1, questions.length)} / {questions.length}
        </b>
        <br />
        Quelle structure correspond à : « {question.enonce} » ?
      </p>
      {question.options.map((option) => {
        const juste = option === question.bonneReponse;
        const etat = answered === null ? "" : juste ? "juste" : answered === option ? "faux" : "";
        return (
          <button
            key={option}
            className={etat}
            disabled={answered !== null}
            onClick={() => setAnswered(option)}
          >
            {option}
          </button>
        );
      })}
      {answered !== null && (
        <p className="quiz-feedback">
          {answered === question.bonneReponse
            ? "Correct."
            : `Non — la bonne réponse est « ${question.bonneReponse} ».`}
        </p>
      )}
      {answered !== null && !termine && (
        <button
          className="lesson-button"
          onClick={() => {
            setIndex(index + 1);
            setAnswered(null);
          }}
        >
          Question suivante <ArrowRight size={16} />
        </button>
      )}
      {termine && (
        <button
          className="lesson-button"
          onClick={() => {
            setIndex(0);
            setAnswered(null);
          }}
        >
          Recommencer <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
