#!/usr/bin/env node
/**
 * Pilote l'export Z-Anatomy sans ouvrir Blender (Sprint 12).
 *
 * `docs/import-zanatomy.md` décrivait huit gestes à répéter 78 fois dans
 * l'interface. Ce script les exécute : il lit la taxonomie, demande à Blender
 * d'exporter en arrière-plan, et rend compte structure par structure. La seule
 * chose qu'il ne peut pas faire à ta place est de télécharger le `.blend` —
 * plusieurs giga-octets, sur un site qui n'a pas d'API.
 *
 *   npm run anatomie:blender -- --blend=C:/…/Z-Anatomy.blend --inventaire
 *   npm run anatomie:blender -- --blend=C:/…/Z-Anatomy.blend
 *   npm run anatomie:blender -- --blend=… --structure=crane-entier
 *
 * L'inventaire s'exécute une fois : il liste les noms réels des objets de la
 * source, ce qui permet de vérifier ce que la taxonomie cherche avant de lancer
 * 78 exports. Une correspondance devinée qui échoue coûte une passe entière.
 *
 * Le résultat va dans un dossier de travail hors du dépôt (par défaut
 * `../z-anatomy-export`), puis `npm run anatomie:import` le reprend.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { STRUCTURES } from "../app/content/taxonomie.ts";

const arg = (nom) =>
  process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? null;
const drapeau = (nom) => process.argv.includes(`--${nom}`);

/** Emplacements d'installation habituels sous Windows, du plus récent au plus ancien. */
const CANDIDATS_BLENDER = [
  process.env.BLENDER_EXE,
  ...["4.5", "4.4", "4.3", "4.2", "4.1", "4.0"].map(
    (v) => `C:/Program Files/Blender Foundation/Blender ${v}/blender.exe`,
  ),
  "/usr/bin/blender",
  "/Applications/Blender.app/Contents/MacOS/Blender",
].filter(Boolean);

const blender = CANDIDATS_BLENDER.find((chemin) => existsSync(chemin));
if (!blender) {
  console.error(
    "Blender introuvable. Indiquer son chemin :\n" +
      '  $env:BLENDER_EXE="C:/Program Files/Blender Foundation/Blender 4.3/blender.exe"',
  );
  process.exit(1);
}

const blend = arg("blend");
if (!blend || !existsSync(blend)) {
  console.error(
    `Il manque --blend=<chemin vers le fichier Z-Anatomy>.\n` +
      `  Téléchargement : https://www.z-anatomy.com (ou la section Releases du dépôt GitHub).`,
  );
  process.exit(1);
}

const sortie = resolve(arg("sortie") ?? "../z-anatomy-export");
const rapport = join(tmpdir(), `gremah-zanatomy-${Date.now()}.json`);
const script = resolve("scripts/export-zanatomy.py");

if (drapeau("inventaire")) {
  lancer(["--inventaire", `--rapport=${rapport}`]);
  const { objets } = JSON.parse(readFileSync(rapport, "utf8"));
  const destination = "assets/models-src/zanatomy-objets.json";
  mkdirSync("assets/models-src", { recursive: true });
  writeFileSync(destination, `${JSON.stringify({ objets }, null, 1)}\n`);
  console.log(`\n${objets.length} objets maillés relevés → ${destination}`);
  console.log(rapprocher(objets));
  process.exit(0);
}

const cible = arg("structure");
const aExporter = STRUCTURES.filter(
  (s) => (cible ? s.id === cible : true) && (drapeau("tout") || s.statut !== "livree" || cible),
);
if (aExporter.length === 0) {
  console.error(cible ? `${cible} n'est pas déclarée dans la taxonomie.` : "Rien à exporter.");
  process.exit(1);
}

// Les clés de recherche vont du plus sûr au plus large : l'objet nommé dans la
// taxonomie s'il est connu, sinon le latin — c'est ainsi que Z-Anatomy nomme —
// et enfin l'anglais, que la source utilise pour quelques ensembles.
const plan = aExporter.map((s) => ({
  id: s.id,
  cles: [s.sourceObjet, s.latin, s.english].filter(Boolean),
}));
const planChemin = join(tmpdir(), `gremah-plan-${Date.now()}.json`);
writeFileSync(planChemin, JSON.stringify(plan));

console.log(`${plan.length} structure(s) à exporter vers ${sortie}\n`);
lancer([`--plan=${planChemin}`, `--sortie=${sortie}`, `--rapport=${rapport}`]);

const { resultats } = JSON.parse(readFileSync(rapport, "utf8"));
const parEtat = (etat) => resultats.filter((r) => r.etat === etat);
console.log(
  `\n✓ ${parEtat("exporte").length} exportée(s) · ` +
    `⚠ ${parEtat("vide").length} vide(s) · ` +
    `✗ ${parEtat("introuvable").length} introuvable(s) · ` +
    `${parEtat("erreur").length} erreur(s)`,
);

const introuvables = parEtat("introuvable");
if (introuvables.length > 0) {
  console.log(
    `\nStructures sans objet correspondant. Le nom cherché n'est pas celui de la\n` +
      `source : relever le vrai nom dans l'inventaire, puis le poser en\n` +
      `« sourceObjet » dans app/content/taxonomie.ts.\n`,
  );
  for (const r of introuvables) console.log(`  ${r.id.padEnd(28)} cherché : ${r.cles.join(" / ")}`);
}

if (parEtat("exporte").length > 0) {
  console.log(`\nÉtape suivante :\n  npm run anatomie:import -- --dossier=${sortie}`);
}

function lancer(argumentsPython) {
  // `-b` : pas d'interface. Blender écrit beaucoup sur sa sortie standard ; on
  // la laisse passer telle quelle, le rapport exploitable est le fichier JSON.
  execFileSync(blender, ["-b", blend, "-P", script, "--", ...argumentsPython], {
    stdio: "inherit",
  });
}

/** Ce que la taxonomie cherche, et ce que la source contient — côte à côte. */
function rapprocher(objets) {
  const normaliser = (nom) =>
    nom
      .replace(/\.\d{3}$/, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .trim();
  const presents = new Set(objets.map((o) => normaliser(o.nom)));
  const manquantes = STRUCTURES.filter(
    (s) =>
      ![s.sourceObjet, s.latin, s.english].filter(Boolean).some((c) => presents.has(normaliser(c))),
  );
  return (
    `\n${STRUCTURES.length - manquantes.length}/${STRUCTURES.length} structures trouvent ` +
    `un objet de même nom.\n` +
    (manquantes.length
      ? `À nommer explicitement (« sourceObjet ») :\n` +
        manquantes.map((s) => `  ${s.id.padEnd(28)} ${s.latin}`).join("\n")
      : "")
  );
}
