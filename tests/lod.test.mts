import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  lodUrl,
  baseUrlOf,
  selectLevel,
  memoryBudgetBytes,
  estimateResidentBytes,
  PREVIEW_LEVEL,
} from "../app/engine/loaders/lod.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MODELS = join(ROOT, "public", "models");

/** Budgets du Sprint 2. Un dépassement doit casser la CI, pas surprendre un
 *  étudiant au moment de sa facture data. */
const MAX_SINGLE_GLB_MB = 2; // CLAUDE.md §9
const MAX_LEVEL_SET_MB = 8; // ce qu'un étudiant télécharge au plus, tous organes

test("lodUrl dérive les niveaux depuis l'URL de base", () => {
  assert.equal(lodUrl("/models/heart.glb", 0), "/models/heart.glb");
  assert.equal(lodUrl("/models/heart.glb", 1), "/models/heart-lod1.glb");
  assert.equal(lodUrl("/models/heart.glb", 2), "/models/heart-lod2.glb");
});

test("baseUrlOf est l'inverse de lodUrl", () => {
  for (const level of [0, 1, 2] as const) {
    assert.equal(baseUrlOf(lodUrl("/models/kidneys.glb", level)), "/models/kidneys.glb");
  }
});

test("le profil fixe un plancher que la distance ne peut pas franchir", () => {
  // Un Android d'entrée de gamme (lodBias 2) reste au niveau le plus léger même
  // caméra collée à l'organe : c'est tout l'intérêt du plancher.
  assert.equal(selectLevel(2, 4.8), 2);
  assert.equal(selectLevel(2, 12), 2);
  // Un desktop (lodBias 0) suit la distance.
  assert.equal(selectLevel(0, 5), 0);
  assert.equal(selectLevel(0, 8), 1);
  assert.equal(selectLevel(0, 11), 2);
  // Un profil medium ne descend jamais sous le niveau 1.
  assert.equal(selectLevel(1, 4.8), 1);
});

test("le budget mémoire suit la mémoire de l'appareil", () => {
  const small = memoryBudgetBytes(2, true);
  const mid = memoryBudgetBytes(4, true);
  const large = memoryBudgetBytes(8, false);
  assert.ok(small < mid && mid < large);
  // Un téléphone à 2 Go ne doit jamais se voir accorder plus de 64 Mo : au-delà,
  // le système tue l'onglet au lieu de ralentir.
  assert.ok(small <= 64 * 1024 * 1024);
  // Sans deviceMemory, un pointeur grossier est traité comme un mobile.
  assert.ok(memoryBudgetBytes(null, true) < memoryBudgetBytes(null, false));
});

test("l'empreinte résidente est estimée au-dessus de la taille du fichier", () => {
  // La géométrie est décompressée et les textures sont stockées non compressées :
  // estimer à la taille du fichier reviendrait à ne pas avoir de budget du tout.
  assert.ok(estimateResidentBytes(1_000_000) > 1_000_000);
});

test("l'aperçu est bien le niveau le plus léger", () => {
  assert.equal(PREVIEW_LEVEL, 2);
});

test("chaque .glb livré tient sous 2 Mo", () => {
  const oversized = readdirSync(MODELS)
    .filter((file) => file.endsWith(".glb"))
    .map((file) => ({ file, mb: statSync(join(MODELS, file)).size / 1024 / 1024 }))
    .filter((entry) => entry.mb > MAX_SINGLE_GLB_MB)
    .map((entry) => `${entry.file} = ${entry.mb.toFixed(2)} Mo`);
  assert.deepEqual(oversized, []);
});

test("chaque niveau complet tient sous 8 Mo", () => {
  const files = readdirSync(MODELS).filter((file) => file.endsWith(".glb"));
  const sets = {
    0: files.filter((file) => !/-lod[12]\.glb$/.test(file)),
    1: files.filter((file) => file.endsWith("-lod1.glb")),
    2: files.filter((file) => file.endsWith("-lod2.glb")),
  };
  for (const [level, group] of Object.entries(sets)) {
    const mb =
      group.reduce((sum, file) => sum + statSync(join(MODELS, file)).size, 0) / 1024 / 1024;
    assert.ok(
      mb < MAX_LEVEL_SET_MB,
      `le niveau ${level} pèse ${mb.toFixed(2)} Mo (max ${MAX_LEVEL_SET_MB} Mo)`,
    );
  }
});

test("le manifeste couvre tous les organes et tous les niveaux", () => {
  const manifest = JSON.parse(readFileSync(join(MODELS, "manifest.json"), "utf8"));
  const organs = Object.keys(manifest.organs);
  assert.ok(organs.length >= 9, `${organs.length} organes dans le manifeste`);
  for (const [name, entry] of Object.entries(manifest.organs)) {
    const record = entry as { levels: { file: string }[] };
    assert.equal(record.levels.length, 3, `${name} n'a pas 3 niveaux`);
    for (const level of record.levels) {
      assert.ok(
        statSync(join(MODELS, level.file)).isFile(),
        `${level.file} annoncé au manifeste mais absent`,
      );
    }
  }
});
