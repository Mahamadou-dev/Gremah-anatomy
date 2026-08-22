import test from "node:test";
import assert from "node:assert/strict";
import { organs } from "../app/content/organes.ts";
import { SYSTEMES } from "../app/content/taxonomie.ts";

/**
 * Sprint 15 — garde-fou légué : CLAUDE.md §8, « un champ traduit à moitié
 * est un champ absent ». Aucune structure publiée ne peut avoir un champ
 * français rempli et son miroir anglais vide — ce test casse le build sur un
 * trou de traduction, exactement comme `contenu.test.mts` casse le build sur
 * une source manquante.
 */

function estVide(valeur: unknown): boolean {
  if (typeof valeur === "string") return valeur.trim().length === 0;
  if (Array.isArray(valeur)) return valeur.length === 0;
  return valeur === null || valeur === undefined;
}

test("chaque organe a un miroir anglais complet, champ pour champ", () => {
  const manquants: string[] = [];

  for (const organ of organs) {
    const en = organ.en;
    if (!en) {
      manquants.push(`${organ.id} : aucun bloc "en"`);
      continue;
    }

    const champsSimples: [string, string][] = [
      ["name", en.name],
      ["description", en.description],
      ["poetic", en.poetic],
      ["taille", en.taille],
      ["poids", en.poids],
      ["situation", en.situation],
      ["fonction", en.fonction],
      ["vascularisation", en.vascularisation],
      ["innervation", en.innervation],
      ["drainage", en.drainage],
      ["histologie", en.histologie],
      ["rapports", en.rapports],
      ["leSaviezVous", en.leSaviezVous],
    ];
    for (const [champ, valeur] of champsSimples) {
      if (estVide(valeur)) manquants.push(`${organ.id} / en.${champ}`);
    }

    if (estVide(en.physiologie) || en.physiologie.length !== organ.physiologie.length) {
      manquants.push(
        `${organ.id} / en.physiologie (${en.physiologie?.length ?? 0} vs ${organ.physiologie.length} en FR)`,
      );
    }
    if (estVide(en.pathologies) || en.pathologies.length !== organ.pathologies.length) {
      manquants.push(
        `${organ.id} / en.pathologies (${en.pathologies?.length ?? 0} vs ${organ.pathologies.length} en FR)`,
      );
    }

    if (en.clinique.length !== organ.clinique.length) {
      manquants.push(
        `${organ.id} / en.clinique (${en.clinique.length} vs ${organ.clinique.length} en FR)`,
      );
    } else {
      en.clinique.forEach((fait, index) => {
        if (estVide(fait.titre)) manquants.push(`${organ.id} / en.clinique[${index}].titre`);
        if (estVide(fait.texte)) manquants.push(`${organ.id} / en.clinique[${index}].texte`);
      });
    }

    if (organ.ancrageNiger && !en.ancrageNiger) {
      manquants.push(`${organ.id} / en.ancrageNiger absent alors que le FR est rempli`);
    } else if (organ.ancrageNiger && en.ancrageNiger) {
      if (estVide(en.ancrageNiger.titre)) manquants.push(`${organ.id} / en.ancrageNiger.titre`);
      if (estVide(en.ancrageNiger.texte)) manquants.push(`${organ.id} / en.ancrageNiger.texte`);
    }

    if (en.hotspots.length !== organ.hotspots.length) {
      manquants.push(
        `${organ.id} / en.hotspots (${en.hotspots.length} vs ${organ.hotspots.length} en FR)`,
      );
    } else {
      const idsFr = organ.hotspots.map((h) => h.id).sort();
      const idsEn = en.hotspots.map((h) => h.id).sort();
      if (idsFr.join(",") !== idsEn.join(",")) {
        manquants.push(`${organ.id} / en.hotspots — identifiants différents du FR`);
      }
      en.hotspots.forEach((hotspot) => {
        if (estVide(hotspot.label))
          manquants.push(`${organ.id} / en.hotspots[${hotspot.id}].label`);
        if (estVide(hotspot.detail))
          manquants.push(`${organ.id} / en.hotspots[${hotspot.id}].detail`);
      });
    }
  }

  assert.deepEqual(manquants, []);
});

test("chaque système, région et structure de la taxonomie a un nom anglais", () => {
  // La taxonomie (Sprint 12) porte déjà `english` à côté de `nom` pour les
  // systèmes, régions et structures — ce test garantit que ça reste vrai à
  // mesure que la couverture grandit, plutôt que de laisser un nouvel ajout
  // se glisser sans son miroir.
  const manquants: string[] = [];

  for (const systeme of SYSTEMES) {
    if (estVide(systeme.english)) manquants.push(`système ${systeme.id} / english`);
    for (const region of systeme.regions) {
      if (estVide(region.english)) manquants.push(`région ${systeme.id}/${region.id} / english`);
      for (const structure of region.structures) {
        if (estVide(structure.english)) {
          manquants.push(`structure ${systeme.id}/${region.id}/${structure.id} / english`);
        }
      }
    }
  }

  assert.deepEqual(manquants, []);
});
