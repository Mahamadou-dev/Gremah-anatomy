import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { LICENCES, SOURCES_MODELES, PROVENANCES, MODELES_A_TRACER } from "../content/provenance";
import { COUVERTURE, SYSTEMES } from "../content/taxonomie";
import { BRAND } from "../lib/brand";

export const metadata: Metadata = {
  title: "Crédits et licences — Gremah Anatomy",
  description:
    "Provenance des modèles 3D, licences CC BY-SA, auteurs des jeux de données anatomiques, et distinction avec la licence MIT du code.",
};

/**
 * La page qui rend le §9 de CLAUDE.md vérifiable.
 *
 * Deux licences cohabitent ici et la confusion entre elles serait une faute :
 * le **code** est MIT, les **modèles** sont CC BY-SA. Le partage à l'identique
 * n'est pas un accident dont on s'excuse — c'est ce qui permet à un atlas issu
 * d'un bien commun d'en rester un.
 */
export default function CreditsPage() {
  const modeles = Object.entries(PROVENANCES);

  return (
    <main className="page-shell">
      <article className="page-body">
        <p className="page-kicker">Crédits</p>
        <h1>Modèles, licences et attribution</h1>

        <p>
          Aucun modèle anatomique de {BRAND.name} n&apos;est inventé. Un organe dessiné « au
          plausible » serait une erreur médicale avec une jolie surface — la géométrie vient donc de
          jeux de données ouverts et vérifiables, cités ici un par un.
        </p>

        <h2>Deux licences, à ne pas confondre</h2>
        <dl className="licence-split">
          <div>
            <dt>Le code</dt>
            <dd>
              <b>MIT</b> — réutilisable librement, y compris commercialement, avec mention du droit
              d&apos;auteur.
            </dd>
          </div>
          <div>
            <dt>Les modèles 3D</dt>
            <dd>
              <b>CC BY-SA</b> — attribution obligatoire et <i>partage dans les mêmes conditions</i>{" "}
              : toute œuvre dérivée d&apos;un de ces modèles reste sous la même licence.
            </dd>
          </div>
        </dl>

        <h2>Jeux de données source</h2>
        <ul className="credit-sources">
          {Object.entries(SOURCES_MODELES).map(([id, source]) => {
            const licence = LICENCES[source.licence];
            return (
              <li key={id}>
                <b>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.nom}
                    </a>
                  ) : (
                    source.nom
                  )}
                </b>
                <span>{source.auteurs}</span>
                <span>
                  {licence.url ? (
                    <a href={licence.url} target="_blank" rel="noreferrer">
                      {licence.nom}
                    </a>
                  ) : (
                    licence.nom
                  )}
                </span>
                {source.note ? <small>{source.note}</small> : null}
              </li>
            );
          })}
        </ul>

        <h2>Provenance modèle par modèle</h2>
        <table className="credit-table">
          <thead>
            <tr>
              <th>Modèle</th>
              <th>Jeu de données</th>
              <th>Identifiant d&apos;origine</th>
              <th>Licence</th>
            </tr>
          </thead>
          <tbody>
            {modeles.map(([id, provenance]) => {
              const source = SOURCES_MODELES[provenance.source];
              return (
                <tr key={id} data-a-tracer={provenance.verifie ? undefined : ""}>
                  <td>
                    <code>{id}</code>
                  </td>
                  <td>{source?.nom ?? provenance.source}</td>
                  <td>{provenance.identifiantOrigine ?? "—"}</td>
                  <td>{LICENCES[source?.licence ?? "indeterminee"].nom}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {MODELES_A_TRACER.length > 0 ? (
          <div className="disclaimer-block warn">
            <p>
              <b>Provenance à établir — {MODELES_A_TRACER.length} modèle(s).</b> Les premiers
              modèles du projet proviennent du dépôt dont celui-ci est issu, sans fichier de licence
              joint. Leur chaîne de droits n&apos;est donc pas établie, et nous ne leur attribuons
              aucune licence que nous ne pouvons pas prouver. Huit des neuf ont depuis été remplacés
              par des imports Z-Anatomy tracés ; le dernier subsiste parce que la source ouverte
              retenue ne modélise pas cette structure — il sera remplacé ou retiré, pas requalifié.
              Signaler cette page comme complète alors qu&apos;elle ne l&apos;est pas serait
              exactement le genre de fausse caution que ce projet refuse.
            </p>
            <p>
              Concernés :{" "}
              {MODELES_A_TRACER.map((id, index) => (
                <span key={id}>
                  {index > 0 ? ", " : ""}
                  <code>{id}</code>
                </span>
              ))}
              .
            </p>
          </div>
        ) : null}

        <h2>Couverture anatomique</h2>
        <p>
          La liste des structures visées est arrêtée à l&apos;avance plutôt que constituée au fil
          des imports : {COUVERTURE.structures} structures réparties sur {COUVERTURE.systemes}{" "}
          systèmes, dont <b>{COUVERTURE.livrees} disponibles aujourd&apos;hui</b>. Une structure
          annoncée mais non livrée est signalée comme telle, jamais présentée comme consultable.
        </p>
        <ul className="credit-couverture">
          {SYSTEMES.map((systeme) => {
            const total = systeme.regions.flatMap((region) => region.structures);
            const livrees = total.filter((structure) => structure.statut === "livree").length;
            return (
              <li key={systeme.id}>
                <b>{systeme.nom}</b>
                <span>
                  {livrees} / {total.length}
                </span>
              </li>
            );
          })}
        </ul>

        <h2>Contenu rédactionnel</h2>
        <p>
          Les ouvrages sur lesquels s&apos;appuient les fiches sont listés sur la page{" "}
          <Link href="/sources/">Sources</Link>. Les modèles disent la forme, les ouvrages disent le
          reste — les deux pages sont à lire ensemble.
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
