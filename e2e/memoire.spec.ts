import { test, expect, type Page } from "@playwright/test";

/**
 * Banc mémoire (Sprint 14, charte CLAUDE.md §5.4).
 *
 * Lit `window.__gremahMemory()`, un hameçon exposé par OrganViewer.tsx
 * uniquement derrière `?memtest=1` (jamais en production normale).
 *
 * Le moteur garde délibérément un cache LRU — jusqu'à `CACHE_LIMIT` = 8
 * entrées, chaque niveau de détail d'un organe comptant comme une entrée
 * distincte (app/engine/loaders/assets.ts, `evict()`) — plutôt que de tout
 * décharger à chaque changement d'organe : revenir sur un organe déjà visité
 * doit être instantané, pas re-télécharger. `renderer.info.memory` ne revient
 * donc jamais à zéro après un aller-retour, et un plafond fondé sur les
 * évictions s'est révélé instable en pratique (le raffinement LOD différé
 * ajoute des entrées en arrière-plan, ce qui rendait un plafond « après
 * saturation du cache » sensible au minutage plutôt qu'au vrai invariant).
 *
 * Le test retenu est plus direct et plus robuste : rester en dessous de la
 * limite du cache (les 5 premiers organes tiennent sous `CACHE_LIMIT` = 8) et
 * boucler 20 fois dessus. Une fois le cache chaud, chaque nouvelle visite est
 * une pure lecture en cache — **zéro** allocation GPU supplémentaire attendue,
 * pas une simple borne haute. Si ce nombre grimpe malgré tout, c'est une fuite,
 * pas un effet de bord du raffinement LOD.
 */
test.skip(!process.env.MONGODB_URI, "MONGODB_URI absent : voir SPRINT.md § À faire à la main");

function emailDeTest(): string {
  return `memoire.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.ne`;
}

const MOT_DE_PASSE = "un-mot-de-passe-de-test-assez-long";

async function lireMemoire(page: Page) {
  return page.evaluate(() => {
    const hook = (
      window as unknown as { __gremahMemory?: () => { geometries: number; textures: number } }
    ).__gremahMemory;
    if (!hook) throw new Error("__gremahMemory absent — ?memtest=1 est-il bien posé ?");
    return hook();
  });
}

async function visiterOrgane(page: Page, index: number, total: number) {
  const bouton = page.locator(".organ-item").nth(index % total);
  await bouton.scrollIntoViewIfNeeded();
  // `force: true` : un hotspot-callout ou un panneau de chargement peut
  // transitoirement intercepter le point de clic sans que le bouton lui-même
  // cesse d'être visible/stable — ce n'est pas ce que ce banc mesure.
  await bouton.click({ timeout: 10_000, force: true });
  // Laisser le fondu d'entrée et le raffinement LOD (viewer.ts, refine())
  // se terminer avant de passer au suivant, sinon une charge encore en vol
  // s'ajoute au relevé d'un cycle ultérieur plutôt qu'au sien.
  await page.waitForTimeout(900);
}

test("revisiter des structures déjà chargées ne fait pas grossir la mémoire GPU", async ({
  page,
}) => {
  // 20 cycles de chargement 3D + fondus dépassent largement le délai par défaut
  // (30 s) d'un test Playwright ordinaire — celui-ci en a légitimement besoin.
  test.setTimeout(120_000);

  const email = emailDeTest();
  await page.goto("/inscription/");
  await page.getByLabel("Prénom").fill("Memoire");
  await page.getByLabel("Nom", { exact: true }).fill("E2E");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Région").selectOption("Niamey");
  await page.locator('.auth-form input[type="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/\/atlas\//, { timeout: 15_000 });

  await page.goto("/atlas/?memtest=1");
  await expect(page.locator(".engine-badge")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(400);

  const disponibles = await page.locator(".organ-item").count();
  expect(disponibles, "aucun organe listé — l'atlas a-t-il bien chargé ?").toBeGreaterThan(0);

  // Rester sous CACHE_LIMIT (8, voir assets.ts) : aucune éviction n'entre en
  // jeu, donc toute croissance observée après le premier passage est une
  // vraie fuite, pas un effet du roulement LRU.
  const SOUS_ENSEMBLE = Math.min(disponibles, 5);
  const CYCLES = 20;

  // Premier passage : remplit le cache (téléchargement réel + raffinement LOD).
  for (let i = 0; i < SOUS_ENSEMBLE; i++) {
    await visiterOrgane(page, i, SOUS_ENSEMBLE);
  }
  const cacheChaud = await lireMemoire(page);

  // Passages suivants : uniquement des organes déjà en cache.
  for (let i = SOUS_ENSEMBLE; i < CYCLES; i++) {
    await visiterOrgane(page, i, SOUS_ENSEMBLE);
  }
  const finale = await lireMemoire(page);

  expect(
    finale.geometries,
    `géométries GPU une fois le cache chaud : ${cacheChaud.geometries} → ${finale.geometries} ` +
      `après ${CYCLES - SOUS_ENSEMBLE} revisites de structures déjà chargées`,
  ).toBe(cacheChaud.geometries);
  expect(
    finale.textures,
    `textures GPU une fois le cache chaud : ${cacheChaud.textures} → ${finale.textures} ` +
      `après ${CYCLES - SOUS_ENSEMBLE} revisites de structures déjà chargées`,
  ).toBe(cacheChaud.textures);
});
