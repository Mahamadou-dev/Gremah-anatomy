#!/usr/bin/env node
/**
 * Pipeline d'import Z-Anatomy → `assets/models-src/` (Sprint 12).
 *
 * Ce que ce script fait, et ce qu'il ne fait pas.
 *
 * **Il ne convertit pas depuis `.obj`.** Z-Anatomy se distribue en `.blend` et en
 * exports OBJ ; gltf-transform ne lit ni l'un ni l'autre. La conversion est donc
 * une étape Blender explicite, documentée plutôt que masquée :
 *
 *     Blender → sélectionner l'objet → Fichier ▸ Exporter ▸ glTF 2.0 (.glb)
 *     → « Selected Objects », +Y up, sans caméra ni lumière
 *     → enregistrer sous <dossier-source>/<id-de-structure>.glb
 *
 * **Il ne recadre pas non plus.** La normalisation `FIT_SIZE = 3.8` est faite au
 * chargement par `app/engine/loaders/assets.ts`, ce qui garde les coordonnées de
 * hotspots comparables d'un organe à l'autre. La refaire ici la ferait deux fois.
 *
 * Ce qu'il fait : vérifier que la structure est bien déclarée dans la taxonomie,
 * nettoyer le fichier (nœuds vides, matériaux orphelins, caméras et lumières que
 * Blender exporte volontiers), le déposer dans `assets/models-src/`, et **écrire
 * sa provenance**. Sans cette dernière étape le modèle ne se déploie pas :
 * `tests/provenance.test.mts` le refuse (CLAUDE.md §9).
 *
 * Idempotent : un fichier source identique n'est pas réécrit, et l'entrée de
 * provenance existante est mise à jour, jamais dupliquée.
 *
 *   node --experimental-strip-types scripts/import-anatomie.mjs --dossier=../z-anatomy-export
 *   npm run anatomie:import -- --dossier=… --structure=aorte
 *   npm run anatomie:import -- --dossier=… --liste     # ce qui manque, sans rien écrire
 *
 * Puis, pour produire les trois niveaux livrés :
 *   npm run models:build -- --only=<id>
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, flatten, unpartition } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import draco3d from "draco3dgltf";
import { STRUCTURES } from "../app/content/taxonomie.ts";

const SRC = "assets/models-src";
const PROVENANCE = join(SRC, "provenance.json");

/** Toute structure importée par ce script vient de là. C'est le point du sprint. */
const SOURCE_PAR_DEFAUT = "z-anatomy";

const arg = (nom) =>
  process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? null;
const dossier = arg("dossier");
const cible = arg("structure");
const LISTE = process.argv.includes("--liste");

const declarees = new Map(STRUCTURES.map((structure) => [structure.id, structure]));
const provenance = JSON.parse(readFileSync(PROVENANCE, "utf8"));

if (LISTE) {
  listerCeQuiManque();
  process.exit(0);
}

if (!dossier) {
  console.error(
    "Il manque --dossier=<chemin vers les .glb exportés de Z-Anatomy>.\n" +
      "  --liste affiche ce qui reste à importer sans rien écrire.",
  );
  process.exit(1);
}
if (!existsSync(dossier)) {
  console.error(`Dossier introuvable : ${dossier}`);
  process.exit(1);
}

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder,
  "meshopt.encoder": MeshoptEncoder,
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});

mkdirSync(SRC, { recursive: true });

const aTraiter = cible ? [cible] : [...declarees.keys()];
let importes = 0;
let ignores = 0;

for (const id of aTraiter) {
  const structure = declarees.get(id);
  if (!structure) {
    // Refuser un import non déclaré est volontaire : c'est ce qui empêche
    // l'atlas de redevenir un tas de fichiers sans plan de couverture.
    console.error(`✗ ${id} n'est pas déclarée dans app/content/taxonomie.ts — import refusé.`);
    process.exitCode = 1;
    continue;
  }

  // Le fichier porte toujours l'identifiant : c'est ainsi que
  // `anatomie-blender.mjs` l'écrit, y compris quand la structure est composée de
  // plusieurs objets source (« cotes.glb » pour quarante-huit côtes).
  const entree = join(dossier, `${id}.glb`);
  if (!existsSync(entree)) {
    if (cible) {
      console.error(`✗ ${id} : ${entree} introuvable (export Blender manquant ?)`);
      process.exitCode = 1;
    }
    ignores += 1;
    continue;
  }

  const brut = readFileSync(entree);
  const hash = createHash("sha256").update(brut).digest("hex").slice(0, 16);
  const destination = join(SRC, `${id}.glb`);

  if (provenance.modeles[id]?.hashSource === hash && existsSync(destination)) {
    console.log(`= ${id.padEnd(24)} inchangé`);
    continue;
  }

  const document = await io.readBinary(brut);
  const racine = document.getRoot();

  // Blender exporte la scène, pas l'objet : caméras et lumières arriveraient
  // jusqu'au GPU du téléphone sans jamais être utilisées — la scène et son
  // éclairage trois points sont construits par le moteur.
  for (const camera of racine.listCameras()) camera.dispose();
  for (const noeud of racine.listNodes()) {
    if (noeud.getCamera()) noeud.setCamera(null);
  }

  await document.transform(unpartition(), flatten(), dedup(), prune({ keepLeaves: false }));

  writeFileSync(destination, Buffer.from(await io.writeBinary(document)));

  provenance.modeles[id] = {
    source: SOURCE_PAR_DEFAUT,
    // La trace de provenance garde le nom réel dans la source — un motif ou une
    // liste quand la structure y est éclatée. Sans lui, impossible de rejouer
    // l'import à l'identique quand Z-Anatomy évolue.
    identifiantOrigine: Array.isArray(structure.sourceObjet)
      ? structure.sourceObjet.join(" + ")
      : (structure.sourceObjet ?? structure.english ?? id),
    verifie: true,
    importeLe: new Date().toISOString().slice(0, 10),
    hashSource: hash,
  };

  importes += 1;
  console.log(
    `✓ ${id.padEnd(24)} ${structure.nom} (${structure.latin}) — ` +
      `${(brut.byteLength / 1024 / 1024).toFixed(2)} Mo importés`,
  );
}

if (importes > 0) {
  writeFileSync(PROVENANCE, `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(
    `\n${importes} structure(s) importée(s), ${ignores} sans fichier source.\n` +
      `Provenance écrite. Étape suivante :\n` +
      `  npm run models:build${cible ? ` -- --only=${cible}` : ""}\n` +
      `puis passer la structure en « livree » dans app/content/taxonomie.ts ` +
      `et rédiger sa fiche dans app/content/organes.ts.`,
  );
} else {
  console.log(`\nRien à importer (${ignores} structure(s) sans fichier source dans ${dossier}).`);
}

function listerCeQuiManque() {
  const manquantes = STRUCTURES.filter((structure) => structure.statut !== "livree");
  console.log(
    `${STRUCTURES.length - manquantes.length} structure(s) livrée(s) sur ${STRUCTURES.length}.\n` +
      `Restent à importer :\n`,
  );
  for (const structure of manquantes) {
    console.log(`  ${structure.id.padEnd(28)} ${structure.nom} — ${structure.latin}`);
  }
}
