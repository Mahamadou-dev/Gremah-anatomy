#!/usr/bin/env node
/**
 * Pilote l'export Z-Anatomy sans ouvrir Blender (Sprint 12).
 *
 * Sortir une structure de Z-Anatomy demandait huit gestes dans l'interface, à
 * répéter 78 fois. Ce script les exécute : il récupère la source si elle manque,
 * lit la taxonomie, pilote Blender en arrière-plan, et rend compte structure par
 * structure. Aucun geste manuel ne subsiste.
 *
 *   npm run anatomie:blender -- --telecharger --inventaire   # la première fois
 *   npm run anatomie:blender                                 # exporte le reste
 *   npm run anatomie:blender -- --structure=crane-entier     # une seule
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

/**
 * La source, telle qu'elle est réellement distribuée : une archive de 83 Mo dans
 * le dépôt GitHub de Z-Anatomy, qui contient `Startup.blend` (~307 Mo une fois
 * extrait). Pas de « plusieurs giga-octets » : c'est une simple URL HTTPS, donc
 * le téléchargement n'a aucune raison d'être un geste manuel.
 */
const ARCHIVE =
  "https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip";
const CACHE = resolve(process.env.ZANATOMY_CACHE ?? "../z-anatomy");
const BLEND_CACHE = join(CACHE, "extrait/Z-Anatomy/Startup.blend");

let blend = arg("blend") ?? (existsSync(BLEND_CACHE) ? BLEND_CACHE : null);

if (!blend && drapeau("telecharger")) blend = await telecharger();

if (!blend || !existsSync(blend)) {
  console.error(
    `Source Z-Anatomy absente.\n\n` +
      `  npm run anatomie:blender -- --telecharger      # 83 Mo, une seule fois\n` +
      `  npm run anatomie:blender -- --blend=<chemin>   # si tu l'as déjà ailleurs\n\n` +
      `Licence CC BY-SA 4.0 : les modèles dérivés le restent (CLAUDE.md §9).`,
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

// Les clés vont du plus sûr au plus large : le nom d'objet posé dans la
// taxonomie s'il est connu, puis l'**anglais** — c'est ainsi que Z-Anatomy nomme
// ses objets, contrairement à ce qu'on pouvait supposer d'un atlas en
// Terminologia Anatomica — et le latin en dernier recours.
const plan = aExporter.map((s) => ({
  id: s.id,
  cles: [s.sourceObjet, s.english, s.latin].filter(Boolean),
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

/** Récupère et extrait l'archive Z-Anatomy. Idempotent : ne retélécharge pas. */
async function telecharger() {
  mkdirSync(CACHE, { recursive: true });
  const zip = join(CACHE, "Z-Anatomy.zip");

  if (!existsSync(zip)) {
    console.log(`Téléchargement de Z-Anatomy (83 Mo) → ${zip}`);
    const reponse = await fetch(ARCHIVE);
    if (!reponse.ok) {
      console.error(
        `Échec du téléchargement (${reponse.status}). Récupérer l'archive à la main :\n  ${ARCHIVE}`,
      );
      process.exit(1);
    }
    writeFileSync(zip, Buffer.from(await reponse.arrayBuffer()));
  }

  // `tar` lit les .zip sur Windows 10+, macOS et Linux : c'est le seul
  // décompresseur qu'on puisse supposer présent sans ajouter de dépendance.
  const extrait = join(CACHE, "extrait");
  mkdirSync(extrait, { recursive: true });
  console.log("Extraction…");
  execFileSync("tar", ["-xf", zip, "-C", extrait], { stdio: "inherit" });

  if (!existsSync(BLEND_CACHE)) {
    console.error(`Archive extraite, mais ${BLEND_CACHE} est absent — contenu inattendu.`);
    process.exit(1);
  }
  console.log(`Source prête : ${BLEND_CACHE}\n`);
  return BLEND_CACHE;
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
  // Même normalisation que côté Blender : suffixes de latéralité (`.l`, `.r`),
  // de jonction (`.j`) et d'insertion (`.i`), parenthèses, doublons `.001`.
  const normaliser = (nom) =>
    nom
      .replace(/(\.(l|r|j|i|ol|or|jl|jr|il|ir|b|m|\d{3}))+$/i, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .trim();
  const presents = new Set(objets.map((o) => normaliser(o.nom)));
  const manquantes = STRUCTURES.filter(
    (s) =>
      ![s.sourceObjet, s.english, s.latin].filter(Boolean).some((c) => presents.has(normaliser(c))),
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
