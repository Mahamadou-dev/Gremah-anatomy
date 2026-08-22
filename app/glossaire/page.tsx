import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { organs } from "../content/organes";

export const metadata: Metadata = {
  title: "Glossaire haoussa / zarma — Gremah Anatomy",
  description:
    "Vocabulaire vernaculaire des organes en haoussa et en zarma — un apport culturel posé à côté de la nomenclature internationale.",
};

/**
 * Ressource dédiée (Sprint 15, point 6) : le vocabulaire local vivait jusqu&apos;ici
 * éparpillé dans un champ optionnel de chaque organe (`organ.vernaculaire`,
 * introduit au Sprint 5). Cette page le rassemble et l&apos;expose comme ce qu&apos;il
 * est : un apport culturel réel, à côté de la nomenclature internationale,
 * jamais à sa place (CLAUDE.md §8).
 *
 * Le haoussa n&apos;est rempli que pour des termes courants et bien attestés — pas
 * une traduction médicale, un mot de la langue de tous les jours. Le zarma
 * reste vide : aucun terme n&apos;a été vérifié auprès d&apos;un locuteur, et CLAUDE.md
 * l&apos;interdit formellement : « inventer un terme serait pire que le laisser
 * vide ». Voir SPRINT.md, « À faire à la main » — c&apos;est un blocage humain, pas
 * un oubli.
 */
export default function GlossairePage() {
  const entrees = organs
    .filter((organ) => organ.vernaculaire?.hausa)
    .map((organ) => ({
      id: organ.id,
      nom: organ.name,
      latin: organ.latin,
      english: organ.en.name,
      hausa: organ.vernaculaire!.hausa!,
    }));

  return (
    <main className="page-shell">
      <article className="page-body">
        <p className="page-kicker">Glossaire</p>
        <h1>Vocabulaire haoussa et zarma</h1>

        <p>
          Le corps se nomme aussi dans les langues qu&apos;on parle à la maison. Cette page
          rassemble le vocabulaire vernaculaire des organes de l&apos;atlas, en haoussa et — à terme
          — en zarma, posé à côté de la nomenclature française, latine et anglaise plutôt qu&apos;à
          sa place.
        </p>

        <div className="disclaimer-block">
          <p>
            Le haoussa listé ici est un mot courant, pas un terme médical technique traduit. Aucun
            terme n&apos;est inventé : une case vide signifie qu&apos;aucune source fiable n&apos;a
            encore été trouvée, jamais une supposition déguisée en fait.
          </p>
        </div>

        <div
          className="credit-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Glossaire, défilement horizontal"
        >
          <table className="credit-table">
            <thead>
              <tr>
                <th>Français</th>
                <th>Latin (TA)</th>
                <th>English</th>
                <th>Haoussa</th>
                <th>Zarma</th>
              </tr>
            </thead>
            <tbody>
              {entrees.map((entree) => (
                <tr key={entree.id}>
                  <td>{entree.nom}</td>
                  <td>
                    <i>{entree.latin}</i>
                  </td>
                  <td>{entree.english}</td>
                  <td lang="ha">{entree.hausa}</td>
                  <td className="a-completer" lang="dje">
                    <em>à compléter</em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="disclaimer-block warn">
          <p>
            <b>Zarma — à compléter.</b> Aucun terme zarma n&apos;a encore été vérifié auprès
            d&apos;un locuteur. Inventer un mot serait pire que laisser la case vide (CLAUDE.md §8)
            : cette colonne reste volontairement inoccupée jusqu&apos;à ce qu&apos;un contact fiable
            la remplisse. Voir SPRINT.md, « À faire à la main ».
          </p>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
