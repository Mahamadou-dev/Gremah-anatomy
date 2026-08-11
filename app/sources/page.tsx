import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SOURCES, AVERTISSEMENT } from "../content/sources";
import { organs } from "../content/organes";

export const metadata: Metadata = {
  title: "Sources et références — Gremah Anatomy",
  description:
    "Ouvrages et documents sur lesquels s'appuie le contenu anatomique de Gremah Anatomy, et avertissement pédagogique.",
};

/**
 * La page qui rend le §8 de CLAUDE.md vérifiable par l'étudiant lui-même.
 *
 * Elle n'existe pas pour la forme : un atlas qui affirme sans dire d'où il tient
 * ses affirmations demande une confiance qu'il n'a pas méritée. Chaque organe
 * indique ici les références qu'il mobilise.
 */
export default function SourcesPage() {
  return (
    <main className="page-shell">
      <article className="page-body">
        <p className="page-kicker">Références</p>
        <h1>Sources</h1>

        <div className="disclaimer-block">
          <p>{AVERTISSEMENT}</p>
        </div>

        <p>
          Le contenu anatomique de Gremah Anatomy est rédigé en français à partir des ouvrages de
          référence ci-dessous. La nomenclature latine suit la <i>Terminologia Anatomica</i>. Les
          données épidémiologiques citées dans les encarts « Contexte nigérien » proviennent de
          l&apos;Organisation mondiale de la Santé.
        </p>

        <p>
          Nous citons les ouvrages, jamais une page précise : une pagination change d&apos;une
          édition à l&apos;autre, et une référence qu&apos;on ne peut pas vérifier vaut moins que
          pas de référence du tout.
        </p>

        <div className="disclaimer-block warn">
          <p>
            <b>Relecture médicale.</b> Ce contenu doit être relu et validé par un enseignant en
            médecine avant d&apos;être utilisé comme support de révision. Si vous relevez une
            erreur, signalez-la : une erreur médicale est traitée ici comme un bug bloquant.
          </p>
        </div>

        <h2>Ouvrages et documents</h2>
        <ol className="source-list">
          {SOURCES.map((source) => (
            <li key={source.id}>
              <code>{source.id}</code>
              <span>{source.citation}</span>
            </li>
          ))}
        </ol>

        <h2>Références par organe</h2>
        <ul className="organ-sources">
          {organs.map((organ) => (
            <li key={organ.id}>
              <b>
                {organ.name} <i>({organ.latin})</i>
              </b>
              <span>{organ.sources.join(" · ")}</span>
            </li>
          ))}
        </ul>

        <h2>Vocabulaire local</h2>
        <p>
          Le glossaire hausa proposé sur les fiches recense des termes courants et bien attestés. Le
          zarma reste à compléter par un locuteur : inventer un terme anatomique serait pire que de
          laisser la case vide. Les contributions sont bienvenues.
        </p>
        <ul className="glossaire">
          {organs
            .filter((organ) => organ.vernaculaire?.hausa)
            .map((organ) => (
              <li key={organ.id}>
                <b>{organ.name}</b>
                <span>{organ.vernaculaire?.hausa}</span>
              </li>
            ))}
        </ul>
      </article>
      <SiteFooter />
    </main>
  );
}
