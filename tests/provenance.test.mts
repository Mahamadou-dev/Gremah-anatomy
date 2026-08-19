import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SYSTEMES, STRUCTURES, STRUCTURES_LIVREES } from "../app/content/taxonomie.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MODELS = join(ROOT, "public", "models");
const PROVENANCE = join(ROOT, "assets", "models-src", "provenance.json");

const provenance = JSON.parse(readFileSync(PROVENANCE, "utf8"));
const manifest = JSON.parse(readFileSync(join(MODELS, "manifest.json"), "utf8"));

/** CLAUDE.md §9 — plafond **par structure**, tous niveaux confondus. */
const MAX_STRUCTURE_MB = 2;

test("chaque modèle livré porte une provenance", () => {
  const sans = Object.keys(manifest.organs).filter((id) => !provenance.modeles[id]);
  assert.deepEqual(
    sans,
    [],
    `modèle(s) sans provenance : ${sans.join(", ")} — CLAUDE.md §9, ils ne peuvent pas se déployer`,
  );
});

test("chaque provenance pointe une source connue, elle-même sous licence connue", () => {
  for (const [id, entree] of Object.entries(provenance.modeles) as [
    string,
    { source: string; verifie: boolean },
  ][]) {
    const source = provenance.sources[entree.source];
    assert.ok(source, `${id} référence une source inconnue : ${entree.source}`);
    assert.ok(
      provenance.licences[source.licence],
      `la source ${entree.source} référence une licence inconnue : ${source.licence}`,
    );
    assert.equal(
      typeof entree.verifie,
      "boolean",
      `${id} ne dit pas si sa provenance est vérifiée`,
    );
  }
});

test("une source vérifiée nomme ses auteurs et son adresse", () => {
  // Sans auteur ni URL, l'attribution CC BY-SA n'est pas satisfaite : autant ne
  // pas prétendre que la chaîne est établie.
  for (const [id, source] of Object.entries(provenance.sources) as [
    string,
    { auteurs: string; url: string | null; licence: string },
  ][]) {
    if (source.licence === "indeterminee") continue;
    assert.ok(source.auteurs && source.auteurs !== "inconnus", `source ${id} sans auteur`);
    assert.ok(source.url, `source ${id} sans URL vérifiable`);
  }
});

test("aucune provenance orpheline", () => {
  // Une entrée qui ne correspond à aucun modèle laisse croire à une couverture
  // qui n'existe pas — c'est la même faute qu'un modèle non tracé, à l'envers.
  const orphelines = Object.keys(provenance.modeles).filter((id) => !manifest.organs[id]);
  assert.deepEqual(orphelines, [], `provenance(s) sans modèle : ${orphelines.join(", ")}`);
});

test("chaque structure tient sous 2 Mo, tous niveaux confondus", () => {
  // Le garde-fou du Sprint 2 plafonnait le total. À 60+ structures ce plafond
  // n'a plus de sens : on ne télécharge plus tout, on télécharge une structure.
  const depassements: string[] = [];
  for (const [id, entree] of Object.entries(manifest.organs) as [
    string,
    { levels: { file: string }[] },
  ][]) {
    const octets = entree.levels.reduce(
      (somme, niveau) => somme + statSync(join(MODELS, niveau.file)).size,
      0,
    );
    const mb = octets / 1024 / 1024;
    if (mb > MAX_STRUCTURE_MB) depassements.push(`${id} = ${mb.toFixed(2)} Mo`);
  }
  assert.deepEqual(depassements, [], `structure(s) au-dessus de ${MAX_STRUCTURE_MB} Mo`);
});

test("aucun .glb orphelin dans public/models", () => {
  // Un fichier livré mais absent du manifeste échappe au budget et à la
  // provenance : il pèse sur la facture data de l'étudiant sans rendre de compte.
  const annonces = new Set(
    Object.values(manifest.organs).flatMap((entree) =>
      (entree as { levels: { file: string }[] }).levels.map((niveau) => niveau.file),
    ),
  );
  const orphelins = readdirSync(MODELS)
    .filter((file) => file.endsWith(".glb"))
    .filter((file) => !annonces.has(file));
  assert.deepEqual(orphelins, [], `.glb hors manifeste : ${orphelins.join(", ")}`);
});

test("la taxonomie couvre les onze grands systèmes et 60+ structures", () => {
  assert.ok(SYSTEMES.length >= 11, `${SYSTEMES.length} systèmes — CLAUDE.md §11 en attend onze`);
  assert.ok(STRUCTURES.length >= 60, `${STRUCTURES.length} structures — l'objectif est 60+`);
});

test("les identifiants de structure sont uniques", () => {
  const vus = new Map<string, number>();
  for (const structure of STRUCTURES) vus.set(structure.id, (vus.get(structure.id) ?? 0) + 1);
  const doublons = [...vus].filter(([, n]) => n > 1).map(([id]) => id);
  assert.deepEqual(doublons, [], `identifiant(s) en double : ${doublons.join(", ")}`);
});

test("chaque structure est nommée en FR, en latin TA et en EN", () => {
  // Un champ vide ici deviendrait un trou de traduction au Sprint 13 : autant le
  // refuser à la source.
  const incomplets = STRUCTURES.filter((s) => !s.nom || !s.latin || !s.english).map((s) => s.id);
  assert.deepEqual(
    incomplets,
    [],
    `structure(s) incomplètement nommée(s) : ${incomplets.join(", ")}`,
  );
});

test("toute structure déclarée livrée a bien son modèle", () => {
  // C'est l'invariant qui empêche d'annoncer une couverture qu'on n'a pas.
  const manquants = STRUCTURES_LIVREES.filter((s) => !manifest.organs[s.id]).map((s) => s.id);
  assert.deepEqual(manquants, [], `déclarée(s) livrée(s) sans modèle : ${manquants.join(", ")}`);
});

test("deux structures ne partagent jamais le même objet source", () => {
  // Une valeur dupliquée signifie qu'une édition a débordé d'une entrée sur sa
  // voisine — c'est ainsi que l'arbre bronchique s'est retrouvé à pointer les
  // poumons. Présenter un modèle pour un autre est une erreur anatomique, donc
  // un bug bloquant (CLAUDE.md §8), et rien ne le signalait à l'œil nu.
  const vus = new Map<string, string>();
  const doublons: string[] = [];
  for (const structure of STRUCTURES) {
    if (!structure.sourceObjet) continue;
    const signature = JSON.stringify([structure.sourceObjet].flat());
    const premier = vus.get(signature);
    if (premier) doublons.push(`${structure.id} et ${premier} → ${signature}`);
    else vus.set(signature, structure.id);
  }
  assert.deepEqual(doublons, [], "objet(s) source partagé(s) entre structures");
});
