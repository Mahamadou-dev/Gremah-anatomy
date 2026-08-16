#!/usr/bin/env node
/**
 * Pipeline d'assets — `assets/models-src/*.glb` → `public/models/`.
 *
 * Le diagnostic d'origine du projet (« Draco et KTX2 présents mais non câblés »)
 * était faux : les modèles arrivaient déjà en EXT_meshopt_compression + quantifiés.
 * `npm run models:inspect` a montré la vraie répartition — 3,1 millions de
 * triangles pour neuf organes, et 8,4 Mo de textures encore en PNG. Le levier
 * n'est donc pas la compression de la géométrie, c'est sa **décimation** : 350 000
 * triangles pour un organe affiché dans 400 px n'apporte rien qu'on puisse voir.
 *
 * Trois niveaux sont produits par organe, choisis à l'exécution par le profil de
 * qualité et la distance caméra (voir engine/loaders/lod.ts).
 *
 * Idempotent : un manifeste enregistre le hash de chaque source. Relancer sans
 * changer les sources ne réécrit rien — ce qui évite la décimation en cascade,
 * seule vraie façon de perdre un modèle ici.
 *
 *   node scripts/optimize-models.mjs           # incrémental
 *   node scripts/optimize-models.mjs --force   # tout régénérer
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  weld,
  simplify,
  textureCompress,
  resample,
  flatten,
  join as joinMeshes,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const SRC = "assets/models-src";
const OUT = "public/models";
const MANIFEST = join(OUT, "manifest.json");
const FORCE = process.argv.includes("--force");

/**
 * Ratio de triangles conservés par niveau, et distance caméra à partir de
 * laquelle le niveau devient acceptable. Le niveau 0 lui-même est décimé : la
 * source est du scan brut, pas un asset temps réel.
 */
const LEVELS = [
  { suffix: "", ratio: 0.13, error: 0.002, texture: 1024 },
  { suffix: "-lod1", ratio: 0.055, error: 0.006, texture: 512 },
  { suffix: "-lod2", ratio: 0.022, error: 0.015, texture: 256 },
];

/**
 * Dérogations par structure. Le budget est **par structure** depuis le Sprint 12
 * (< 2 Mo, tous niveaux confondus — CLAUDE.md §9) : une nappe étendue comme la
 * peau dépasse là où un organe compact passe largement. Plutôt que d'abaisser
 * les réglages pour tout le monde, on corrige le cas qui dépasse.
 *
 * Multiplicateurs appliqués aux `LEVELS`. Une entrée ici doit toujours répondre
 * à un dépassement mesuré, jamais à une intuition.
 */
const OVERRIDES = {
  // 2,05 Mo au réglage commun. La peau est une surface presque plane : elle
  // supporte une décimation plus franche sans perte visible de silhouette.
  skin: { ratio: 0.6, texture: 0.5 },
  // 2,22 Mo au réglage commun : la colonne réunit cinquante vertèbres, chacune
  // couverte de reliefs (apophyses, facettes) que la décimation générale
  // préserve trop fidèlement. Vue entière, ces détails sont sous le pixel.
  // Cinquante vertèbres couvertes d'apophyses et de facettes : le ratio seul ne
  // mordait pas, `simplify` butait sur son seuil d'erreur. Vue entière, ces
  // reliefs tiennent sous le pixel — on ouvre donc l'erreur tolérée.
  "colonne-vertebrale": { ratio: 0.3, error: 6 },
};

/** Rebâtir une seule structure : `--only=skin`. Le reste du manifeste est conservé. */
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder,
  "meshopt.encoder": MeshoptEncoder,
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;

mkdirSync(OUT, { recursive: true });
const manifest = readManifest();
const sources = readdirSync(SRC)
  .filter((file) => file.endsWith(".glb"))
  .sort();

let sourceBytes = 0;
let outputBytes = 0;
let rebuilt = 0;

for (const file of sources) {
  const name = basename(file, ".glb");
  if (ONLY && name !== ONLY) {
    const conserve = manifest.organs[name];
    if (conserve) outputBytes += conserve.levels.reduce((sum, level) => sum + level.bytes, 0);
    continue;
  }
  const path = join(SRC, file);
  const bytes = readFileSync(path);
  // L'empreinte couvre la source **et** les réglages : sans cela, ajouter une
  // dérogation ne régénérait rien — le script répondait « inchangé » alors que
  // c'est précisément le réglage qu'on venait de changer.
  const hash = createHash("sha256")
    .update(bytes)
    .update(JSON.stringify(OVERRIDES[name] ?? null))
    .digest("hex")
    .slice(0, 16);
  sourceBytes += bytes.byteLength;

  const previous = manifest.organs[name];
  const outputsExist = LEVELS.every((level) => existsSync(join(OUT, `${name}${level.suffix}.glb`)));
  if (!FORCE && previous?.hash === hash && outputsExist) {
    outputBytes += previous.levels.reduce((sum, level) => sum + level.bytes, 0);
    console.log(`= ${name.padEnd(12)} inchangé`);
    continue;
  }

  const override = OVERRIDES[name];
  const levels = [];
  for (const base of LEVELS) {
    const level = override
      ? {
          ...base,
          // Une dérogation ne porte souvent que sur un axe : la moitié absente
          // vaut 1, sinon elle produisait un NaN qui cassait silencieusement le
          // redimensionnement des textures.
          ratio: base.ratio * (override.ratio ?? 1),
          texture: Math.round(base.texture * (override.texture ?? 1)),
          // Le ratio n'est qu'un plafond : `simplify` s'arrête d'abord sur son
          // seuil d'erreur géométrique. Sur une pièce très détaillée, baisser le
          // ratio ne change donc rien — c'est l'erreur tolérée qu'il faut ouvrir.
          error: base.error * (override.error ?? 1),
        }
      : base;
    // Chaque niveau repart de la source : décimer un niveau déjà décimé accumule
    // l'erreur et finit par percer les surfaces fines (paroi vasculaire, cornée).
    const document = await io.readBinary(bytes);
    const before = countTriangles(document);

    await document.transform(
      // `flatten` + `join` d'abord : moins de nœuds et de primitives, donc moins
      // de draw calls à l'arrivée — c'est le vrai coût sur un GPU de téléphone.
      flatten(),
      dedup(),
      joinMeshes({ keepNamed: true }),
      // La soudure est un prérequis de `simplify` : sans elle, les sommets
      // dupliqués aux coutures UV bloquent l'effondrement des arêtes.
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: level.ratio, error: level.error }),
      resample(),
      prune({ keepAttributes: false, keepLeaves: false }),
      // La texture suit le niveau : un organe vu de loin n'a pas besoin d'un
      // grain de 1024 px, et c'est autant de mémoire GPU en moins sur mobile.
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        resize: [level.texture, level.texture],
      }),
    );

    const output = await io.writeBinary(document);
    const outPath = join(OUT, `${name}${level.suffix}.glb`);
    writeFileSync(outPath, output);
    const after = countTriangles(document);
    levels.push({
      file: `${name}${level.suffix}.glb`,
      bytes: output.byteLength,
      triangles: after,
    });
    outputBytes += output.byteLength;
    console.log(
      `  ${basename(outPath).padEnd(20)} ${mb(output.byteLength)} Mo  ` +
        `${after.toLocaleString("fr-FR").padStart(8)} tri  (source ${before.toLocaleString("fr-FR")})`,
    );
  }

  manifest.organs[name] = { hash, source: file, sourceBytes: bytes.byteLength, levels };
  rebuilt += 1;
  console.log(
    `✓ ${name.padEnd(12)} ${mb(bytes.byteLength)} Mo → ${mb(levels[0].bytes)} Mo ` +
      `(−${Math.round((1 - levels[0].bytes / bytes.byteLength) * 100)} %)`,
  );
}

manifest.generatedAt = new Date().toISOString();
manifest.levels = LEVELS.map((level, index) => ({ index, suffix: level.suffix }));
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `\n${rebuilt} organe(s) régénéré(s). Sources ${mb(sourceBytes)} Mo → ` +
    `livré ${mb(outputBytes)} Mo (tous niveaux confondus).`,
);

// Le budget par structure est vérifié ici en plus de la CI : découvrir un
// dépassement au moment du commit coûte un aller-retour de plus qu'ici, où la
// dérogation qui le corrige est à trois lignes.
const MAX_STRUCTURE_BYTES = 2 * 1024 * 1024;
const depassements = Object.entries(manifest.organs)
  .map(([name, entry]) => [name, entry.levels.reduce((sum, level) => sum + level.bytes, 0)])
  .filter(([, bytes]) => bytes > MAX_STRUCTURE_BYTES);
if (depassements.length > 0) {
  console.error(
    `\n✗ budget dépassé (max 2 Mo par structure, CLAUDE.md §9) :\n` +
      depassements.map(([name, bytes]) => `  ${name} = ${mb(bytes)} Mo`).join("\n") +
      `\n  → ajouter une entrée dans OVERRIDES, puis « npm run models:build -- --only=<nom> ».`,
  );
  process.exitCode = 1;
}

function readManifest() {
  // `--only` restreint le travail à une structure : repartir d'un manifeste vide
  // effacerait les huit autres entrées alors que leurs fichiers sont intacts.
  // C'est arrivé une fois — d'où la garde explicite plutôt qu'un simple `!FORCE`.
  if ((!FORCE || ONLY) && existsSync(MANIFEST)) {
    try {
      return JSON.parse(readFileSync(MANIFEST, "utf8"));
    } catch {
      // Un manifeste illisible ne doit pas bloquer : on repart de zéro.
    }
  }
  return { organs: {} };
}

function countTriangles(document) {
  let triangles = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const indices = primitive.getIndices();
      const position = primitive.getAttribute("POSITION");
      triangles += (indices ? indices.getCount() : (position?.getCount() ?? 0)) / 3;
    }
  }
  return Math.round(triangles);
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}
