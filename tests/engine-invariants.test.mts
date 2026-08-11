import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Filet de sécurité du Sprint 1.
 *
 * Ces invariants ne se vérifient pas en exécutant le moteur — il faudrait un GPU
 * et une frame. Ils se vérifient sur la source, et ils valent la peine : chacun
 * correspond à un choix déjà payé une fois, qu'une refonte ultérieure défera sans
 * s'en apercevoir. Un test qui lit du texte est ici plus honnête qu'un test
 * d'intégration qu'on ne peut pas faire tourner.
 */

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ENGINE = join(ROOT, "app", "engine");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sources(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

const files = sources(ENGINE).map((path) => ({
  path: relative(ROOT, path).replaceAll("\\", "/"),
  code: readFileSync(path, "utf8"),
}));

test("le moteur contient bien les modules attendus", () => {
  assert.ok(files.length >= 8, `seulement ${files.length} modules trouvés dans app/engine`);
});

test("aucun module du moteur n'importe React", () => {
  // La frontière du §4 de CLAUDE.md : `engine/` ignore React, `ui/` ignore three.
  // C'est ce qui permettra de tester le moteur hors navigateur au Sprint 6.
  const offenders = files.filter(({ code }) => /from\s+["']react/.test(code));
  assert.deepEqual(
    offenders.map((file) => file.path),
    [],
  );
});

test("FIT_SIZE vaut toujours 3.8", () => {
  // Les coordonnées de hotspots d'anatomy-data sont écrites dans cet espace
  // normalisé : le changer déplacerait silencieusement chaque point de chaque organe.
  const assets = files.find((file) => file.path.endsWith("loaders/assets.ts"));
  assert.ok(assets, "app/engine/loaders/assets.ts introuvable");
  assert.match(assets.code, /export const FIT_SIZE = 3\.8;/);
});

test("le render-on-demand n'est piloté que par la boucle", () => {
  // Un requestAnimationFrame ailleurs, c'est une boucle continue qui ne dit pas
  // son nom — et la batterie d'un téléphone d'entrée de gamme qui se vide.
  //
  // `engine/scenes/` est la seule exception, et elle est explicite : ce sont des
  // vitrines (l'accueil), pas des outils d'étude. Une vitrine anime en continu
  // par définition. Le test suivant vérifie qu'elles paient au moins le prix
  // d'entrée : suspension hors écran et onglet caché.
  const offenders = files.filter(
    ({ path, code }) =>
      !path.endsWith("core/render-loop.ts") &&
      !path.includes("engine/scenes/") &&
      code.includes("requestAnimationFrame"),
  );
  assert.deepEqual(
    offenders.map((file) => file.path),
    [],
  );
});

test("les scènes vitrines suspendent aussi leur boucle", () => {
  const scenes = files.filter((file) => file.path.includes("engine/scenes/"));
  assert.ok(scenes.length > 0, "aucune scène trouvée sous app/engine/scenes/");
  for (const scene of scenes) {
    assert.match(
      scene.code,
      /new IntersectionObserver/,
      `${scene.path} : pas d'IntersectionObserver`,
    );
    assert.match(scene.code, /visibilitychange/, `${scene.path} : pas de visibilitychange`);
    assert.match(
      scene.code,
      /cancelAnimationFrame/,
      `${scene.path} : la boucle ne s'arrête jamais`,
    );
  }
});

test("la boucle suspend le rendu hors écran et onglet caché", () => {
  const loop = files.find((file) => file.path.endsWith("core/render-loop.ts"))!;
  assert.match(loop.code, /new IntersectionObserver/);
  assert.match(loop.code, /visibilitychange/);
});

test("le cache d'organes reste borné", () => {
  const assets = files.find((file) => file.path.endsWith("loaders/assets.ts"))!;
  // Le Sprint 2 remplacera cette limite fixe par un budget en octets ; d'ici là,
  // l'absence de plafond signifierait une fuite mémoire garantie.
  assert.match(assets.code, /CACHE_LIMIT\s*=\s*\d+/);
  assert.match(assets.code, /private evict\(\)/);
});

test("le depth-prepass est toujours en place", () => {
  const viewer = files.find((file) => file.path.endsWith("engine/viewer.ts"))!;
  assert.match(viewer.code, /colorWrite: false/);
  assert.match(viewer.code, /setDepthPrepass/);
});

test("les deux chemins de rendu existent et le repli est silencieux", () => {
  const renderer = files.find((file) => file.path.endsWith("core/renderer.ts"))!;
  assert.match(renderer.code, /three\/webgpu/);
  assert.match(renderer.code, /new THREE\.WebGLRenderer/);
  // Un adaptateur WebGPU refusé doit retomber en WebGL2, jamais lever.
  assert.match(renderer.code, /catch\s*{\s*\n\s*return null;/);
});

test("le pixel ratio est décidé une fois, jamais adapté par frame", () => {
  const loop = files.find((file) => file.path.endsWith("core/render-loop.ts"))!;
  assert.doesNotMatch(loop.code, /setPixelRatio/);
});

test("l'interface ne touche jamais un objet three directement", () => {
  const ui = join(ROOT, "app", "components");
  const offenders = readdirSync(ui)
    .filter((entry) => entry.endsWith(".tsx"))
    .filter((entry) => /from\s+["']three/.test(readFileSync(join(ui, entry), "utf8")));
  assert.deepEqual(offenders, []);
});
