import test from "node:test";
import assert from "node:assert/strict";
import { organs } from "../app/content/organes.ts";
import { SOURCES, SOURCE_BY_ID } from "../app/content/sources.ts";

/**
 * Le §8 de CLAUDE.md rendu exécutable.
 *
 * « Toute affirmation clinique porte une source » n'est une règle que si quelque
 * chose la fait respecter. Une corrélation clinique ajoutée sans source fait
 * échouer la CI, au même titre qu'une erreur de compilation — c'est le sens de
 * « une erreur médicale est un bug bloquant ».
 */

test("chaque corrélation clinique renvoie à une source existante", () => {
  const orphelines: string[] = [];
  for (const organ of organs) {
    for (const fait of organ.clinique) {
      if (!SOURCE_BY_ID.has(fait.source)) orphelines.push(`${organ.name} / ${fait.titre}`);
    }
    if (organ.ancrageNiger && !SOURCE_BY_ID.has(organ.ancrageNiger.source)) {
      orphelines.push(`${organ.name} / ${organ.ancrageNiger.titre}`);
    }
  }
  assert.deepEqual(orphelines, []);
});

test("chaque organe déclare ses sources et elles existent toutes", () => {
  for (const organ of organs) {
    assert.ok(
      organ.sources.length >= 3,
      `${organ.name} ne cite que ${organ.sources.length} source`,
    );
    for (const id of organ.sources) {
      assert.ok(SOURCE_BY_ID.has(id), `${organ.name} cite une source inconnue : ${id}`);
    }
  }
});

test("la source d'un fait clinique est aussi déclarée par l'organe", () => {
  // Sans ça, la page /sources afficherait une bibliographie incomplète pour un
  // organe dont une fiche cite pourtant l'ouvrage manquant.
  for (const organ of organs) {
    const utilisees = [
      ...organ.clinique.map((fait) => fait.source),
      ...(organ.ancrageNiger ? [organ.ancrageNiger.source] : []),
    ];
    for (const id of utilisees) {
      assert.ok(
        organ.sources.includes(id),
        `${organ.name} utilise « ${id} » sans le déclarer dans sources`,
      );
    }
  }
});

test("le contenu est en français, pas une traduction laissée en chantier", () => {
  // Un marqueur suffit : ces mots ne peuvent pas apparaître dans un texte
  // français correct, et leur présence signale un champ oublié en anglais.
  const anglicismes = /\b(the|blood supply|located|kidney|liver|heart|about the size)\b/i;
  const suspects: string[] = [];
  for (const organ of organs) {
    const champs = [
      organ.description,
      organ.poetic,
      organ.taille,
      organ.situation,
      organ.fonction,
      organ.histologie,
      organ.rapports,
      organ.leSaviezVous,
      ...organ.physiologie,
      ...organ.hotspots.map((point) => `${point.label} ${point.detail}`),
    ];
    champs.forEach((champ) => {
      if (anglicismes.test(champ)) suspects.push(`${organ.name} : ${champ.slice(0, 60)}`);
    });
  }
  assert.deepEqual(suspects, []);
});

test("chaque organe porte les repères qu'un examen interroge", () => {
  for (const organ of organs) {
    for (const champ of [
      "vascularisation",
      "innervation",
      "drainage",
      "histologie",
      "rapports",
    ] as const) {
      assert.ok(organ[champ].length > 30, `${organ.name} : champ « ${champ} » trop pauvre`);
    }
    assert.ok(organ.physiologie.length >= 4, `${organ.name} : physiologie trop courte`);
    assert.ok(organ.clinique.length >= 2, `${organ.name} : moins de deux corrélations cliniques`);
    assert.ok(organ.pathologies.length >= 5, `${organ.name} : liste de pathologies trop courte`);
  }
});

test("chaque point d'intérêt porte son terme latin", () => {
  // La nomenclature Terminologia Anatomica est ce qui permet à l'étudiant de
  // relier la fiche à son cours et à la littérature.
  const sansLatin: string[] = [];
  for (const organ of organs) {
    for (const point of organ.hotspots) {
      if (!point.latin) sansLatin.push(`${organ.name} / ${point.label}`);
    }
  }
  assert.deepEqual(sansLatin, []);
});

test("l'ancrage nigérien couvre la majorité des organes", () => {
  // C'est la contribution différenciante du projet : sans elle, l'atlas est un
  // atlas générique de plus.
  const avecAncrage = organs.filter((organ) => organ.ancrageNiger).length;
  assert.ok(
    avecAncrage >= Math.ceil(organs.length * 0.75),
    `seulement ${avecAncrage}/${organs.length} organes ont un encart nigérien`,
  );
});

test("aucune source déclarée n'est orpheline", () => {
  const utilisees = new Set(organs.flatMap((organ) => organ.sources));
  const inutilisees = SOURCES.filter((source) => !utilisees.has(source.id)).map(
    (source) => source.id,
  );
  assert.deepEqual(inutilisees, []);
});
