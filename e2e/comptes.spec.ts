import { test, expect } from "@playwright/test";

/**
 * Le parcours complet du compte, contre une vraie base — pas un mock.
 * CLAUDE.md §2 bis prévient : la validation client est un confort, elle ne
 * prouve rien ; ces tests-ci prouvent le comportement réel de bout en bout.
 *
 * Ils exigent `MONGODB_URI` et `AUTH_SECRET` sur le processus qui lance
 * `next start` (donc sur le job CI, pas seulement en local où `.env.local`
 * les fournit déjà). Tant que ces secrets ne sont pas posés côté GitHub
 * Actions, ce fichier se saute proprement plutôt que d'échouer sur un 503 —
 * voir SPRINT.md, « À faire à la main ».
 */
test.skip(!process.env.MONGODB_URI, "MONGODB_URI absent : voir SPRINT.md § À faire à la main");

function emailDeTest(): string {
  return `e2e.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.ne`;
}

const MOT_DE_PASSE = "un-mot-de-passe-de-test-assez-long";

test("inscription → atlas → déconnexion", async ({ page }) => {
  const email = emailDeTest();

  await page.goto("/inscription/");
  await page.getByLabel("Prénom").fill("Test");
  await page.getByLabel("Nom", { exact: true }).fill("E2E");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Région").selectOption("Niamey");
  await page.locator('.auth-form input[type="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: /créer mon compte/i }).click();

  // L'inscription ouvre directement une session : atteindre l'atlas sans
  // repasser par l'écran de connexion est le comportement attendu.
  await expect(page).toHaveURL(/\/atlas\//, { timeout: 15_000 });

  await page.getByRole("button", { name: /se déconnecter/i }).click();
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4173\/$/, { timeout: 10_000 });

  // Une fois déconnecté, l'atlas redemande une session.
  await page.goto("/atlas/");
  await expect(page).toHaveURL(/\/connexion\//);
});

test("l'atlas rend un canevas 3D sans erreur console", async ({ page }) => {
  // Le cœur de la charte §5 : un écran noir sur WebGL2, une exception dans le
  // moteur — c'est précisément ce qu'aucun test unitaire ne peut voir, puisqu'ils
  // n'existent que dans un vrai navigateur avec un vrai contexte graphique.
  const erreursConsole: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") erreursConsole.push(message.text());
  });
  page.on("pageerror", (erreur) => erreursConsole.push(erreur.message));

  const email = emailDeTest();
  await page.goto("/inscription/");
  await page.getByLabel("Prénom").fill("Atlas");
  await page.getByLabel("Nom", { exact: true }).fill("E2E");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Région").selectOption("Niamey");
  await page.locator('.auth-form input[type="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/\/atlas\//, { timeout: 15_000 });

  // `engine-badge` n'apparaît qu'une fois `AnatomyViewer.create()` résolu et le
  // premier organe chargé — c'est le signal que le moteur tourne réellement,
  // pas seulement que la page React s'est montée.
  await expect(page.locator(".engine-badge")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".three-mount canvas")).toBeVisible();

  expect(erreursConsole, erreursConsole.join("\n")).toEqual([]);
});

test("le profil permet de modifier, exporter puis supprimer le compte", async ({ page }) => {
  const email = emailDeTest();

  await page.goto("/inscription/");
  await page.getByLabel("Prénom").fill("Profil");
  await page.getByLabel("Nom", { exact: true }).fill("E2E");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Région").selectOption("Niamey");
  await page.locator('.auth-form input[type="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/\/atlas\//, { timeout: 15_000 });

  await page.goto("/profil/");
  await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();

  // Modification : le prénom affiché ailleurs doit suivre.
  await page.getByLabel("Prénom").fill("Modifié");
  await page.getByRole("button", { name: /enregistrer/i }).click();
  await expect(page.getByText("Profil mis à jour.")).toBeVisible();

  // Export : un téléchargement doit se déclencher, pas une erreur.
  const [telechargement] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /exporter mes données/i }).click(),
  ]);
  expect(telechargement.suggestedFilename()).toBe("gremah-anatomy-mes-donnees.json");

  // Suppression : la zone de confirmation, puis le retour à l'accueil, puis
  // la preuve que le compte n'ouvre plus de session.
  await page.getByRole("button", { name: /^supprimer mon compte$/i }).click();
  await page.getByLabel("Confirmez votre mot de passe").fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: /supprimer définitivement/i }).click();
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4173\/$/, { timeout: 10_000 });

  await page.goto("/connexion/");
  await page.getByLabel("Adresse email").fill(email);
  await page.locator('.auth-form input[type="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await expect(page.getByText("Adresse email ou mot de passe incorrect.")).toBeVisible();
});
