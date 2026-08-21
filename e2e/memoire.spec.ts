import { test, expect, type Page } from "@playwright/test";

/**
 * Banc mémoire (Sprint 14, charte CLAUDE.md §5.4 : « dispose complet — tout ce
 * qui est alloué est libéré »).
 *
 * Lit `window.__gremahMemory()`, un hameçon exposé par OrganViewer.tsx
 * uniquement derrière `?memtest=1` (jamais en production normale).
 *
 * Deux approches plus directes ont été essayées et écartées, honnêtement
 * documentées ici plutôt que remplacées en silence :
 *
 * 1. Comparer la mémoire avant/après un aller-retour sur un même organe :
 *    invalide, le moteur garde délibérément un cache LRU (jusqu'à
 *    `CACHE_LIMIT` = 8 entrées, app/engine/loaders/assets.ts) — revenir sur un
 *    organe déjà vu doit être instantané, pas re-téléchargé, donc la mémoire
 *    ne revient jamais à zéro après un aller-retour.
 * 2. Vérifier un plafond une fois le cache « chaud » : instable en pratique.
 *    Le niveau de détail ciblé (`targetLevel()`, viewer.ts) dépend de la
 *    distance caméra au moment du clic ; revisiter un organe peut donc encore
 *    déclencher un chargement réel (l'autre niveau LOD) plutôt qu'une pure
 *    lecture en cache, ce qui fait bouger la mesure indépendamment de toute
 *    fuite.
 *
 * Le test retenu élimine cette ambiguïté en visant l'invariant que la charte
 * garantit vraiment sans conditions : après **destruction complète** du
 * moteur (démontage du composant React, `AnatomyViewer.dispose()` —
 * OrganViewer.tsx), `renderer.info.memory` doit retomber à zéro, quel que
 * soit ce qui a été chargé et mis en cache avant.
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
  // Un `click()` Playwright normal attend que l'élément soit visible, stable ET
  // reçoive les événements pointeur — sous la charge d'allocations GPU répétées
  // de ce banc, cette attente s'est révélée bloquer indéfiniment (le fil
  // principal du navigateur reste occupé par le rendu 3D assez longtemps pour
  // que la vérification de stabilité ne se termine jamais). Un `click()` DOM
  // brut, dispatché directement, teste ce que ce banc veut réellement mesurer
  // — le comportement mémoire du moteur — sans dépendre de la réactivité du
  // fil principal pour de l'outillage de test.
  await bouton.evaluate((el) => (el as HTMLButtonElement).click());
  await page.waitForTimeout(700);
}

test("décharger le moteur après 20 chargements de structures libère toute la mémoire GPU", async ({
  page,
}) => {
  // 20 cycles de chargement 3D + fondus dépassent largement le délai par défaut
  // (30 s) d'un test Playwright ordinaire — celui-ci en a légitimement besoin.
  test.setTimeout(150_000);

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

  const avantDechargement = await lireMemoire(page);
  expect(
    avantDechargement.geometries,
    "le premier organe n'a jamais chargé — le banc ne peut rien mesurer",
  ).toBeGreaterThan(0);

  // 20 chargements réels de structures, en boucle sur les organes disponibles :
  // le point du banc mémoire n'est pas la variété mais le volume de cycles
  // charge/décharge (charte CLAUDE.md §5.4).
  const CYCLES = 20;
  for (let i = 0; i < CYCLES; i++) {
    await visiterOrgane(page, i, disponibles);
  }

  const avantDemontage = await lireMemoire(page);
  expect(
    avantDemontage.geometries,
    "plus aucune géométrie résidente après 20 cycles — le hameçon lit-il le bon moteur ?",
  ).toBeGreaterThan(0);

  // Démonter le composant React qui possède le moteur (OrganViewer.tsx) en
  // quittant l'atlas : son effet de nettoyage appelle `viewer.dispose()`, qui
  // doit libérer toute géométrie et texture encore retenue par le cache LRU,
  // aussi chaud soit-il. `window.__gremahMemory` reste attaché à la même page
  // (navigation interne, pas de rechargement complet) et continue donc de lire
  // `renderer.info.memory` sur le renderer désormais disposé.
  await page
    .getByRole("link", { name: /Gremah/i })
    .first()
    .click();
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4173\/$/, { timeout: 10_000 });
  await page.waitForTimeout(300);

  const finale = await lireMemoire(page);

  expect(
    finale.geometries,
    `géométries GPU : ${avantDemontage.geometries} avant démontage → ${finale.geometries} après. ` +
      "dispose() (app/engine/viewer.ts) doit tout libérer, cache LRU compris.",
  ).toBe(0);
  expect(
    finale.textures,
    `textures GPU : ${avantDemontage.textures} avant démontage → ${finale.textures} après.`,
  ).toBe(0);
});
