/**
 * Garde-fou de taille des modèles 3D — version « par structure » (Sprint 12).
 *
 * L'ancien garde-fou vivait dans la CI et plafonnait `public/models` à 14 Mo au
 * total. C'était tenable à neuf organes ; la taxonomie en déclare 78, donc ce
 * plafond global aurait cassé le build vers la dixième structure importée, pour
 * une raison qui n'a rien à voir avec la qualité de l'import.
 *
 * Le budget qui compte est celui que voit l'étudiant : **une structure, tous ses
 * niveaux de détail confondus, sous 2 Mo** (CLAUDE.md §9). Il ne croît pas avec
 * la taille du catalogue, parce qu'on ne télécharge jamais le catalogue entier.
 *
 * Le même seuil est appliqué par `optimize-models.mjs` à la génération. Le
 * revérifier ici sert à attraper ce qui aurait été committé sans repasser par le
 * script.
 */
import { readFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const MODELS_DIR = "public/models";
const MAX_STRUCTURE_BYTES = 2 * 1024 * 1024;

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
/** Annotation GitHub Actions si on y tourne, ligne lisible sinon. */
const erreur = (message) => console.error(process.env.CI ? `::error::${message}` : `✗ ${message}`);

const manifest = JSON.parse(readFileSync(join(MODELS_DIR, "manifest.json"), "utf8"));
const fichiers = (await readdir(MODELS_DIR)).filter((nom) => nom.endsWith(".glb"));

let echec = false;

// 1. Budget par structure, mesuré sur le disque et non sur ce que déclare le
//    manifeste : un fichier remplacé à la main mentirait sinon en silence.
for (const [nom, entree] of Object.entries(manifest.organs)) {
  let total = 0;
  for (const niveau of entree.levels) {
    const chemin = join(MODELS_DIR, niveau.file);
    let taille;
    try {
      taille = statSync(chemin).size;
    } catch {
      erreur(`${niveau.file} est déclaré dans le manifeste mais absent du disque.`);
      echec = true;
      continue;
    }
    if (taille !== niveau.bytes) {
      erreur(
        `${niveau.file} pèse ${taille} octets, le manifeste en annonce ${niveau.bytes}. ` +
          `Rejouer « npm run models:build -- --only=${nom} ».`,
      );
      echec = true;
    }
    total += taille;
  }
  if (total > MAX_STRUCTURE_BYTES) {
    erreur(
      `${nom} = ${mb(total)} Mo tous niveaux confondus (max 2 Mo par structure, CLAUDE.md §9). ` +
        `→ ajouter une dérogation dans OVERRIDES, puis « npm run models:build -- --only=${nom} ».`,
    );
    echec = true;
  }
}

// 2. Aucun `.glb` orphelin : un modèle hors manifeste n'a ni provenance ni
//    licence, et CLAUDE.md §9 interdit de le déployer.
const declares = new Set(
  Object.values(manifest.organs).flatMap((entree) => entree.levels.map((n) => n.file)),
);
for (const fichier of fichiers) {
  if (!declares.has(fichier)) {
    erreur(`${fichier} n'est déclaré dans aucune entrée du manifeste.`);
    echec = true;
  }
}

const totalDisque = fichiers.reduce((somme, f) => somme + statSync(join(MODELS_DIR, f)).size, 0);
console.log(
  `${Object.keys(manifest.organs).length} structure(s), ${fichiers.length} fichier(s), ` +
    `${mb(totalDisque)} Mo sur disque — budget vérifié par structure.`,
);

process.exitCode = echec ? 1 : 0;
