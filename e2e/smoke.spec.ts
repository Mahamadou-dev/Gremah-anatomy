import { test, expect } from "@playwright/test";

/**
 * Garde-fous de base : les pages publiques répondent, le thème bascule, et
 * l'atlas non authentifié redirige plutôt que de planter. Ce sont ces échecs-là
 * — un écran noir, une exception d'hydratation — qu'aucun test unitaire ne peut
 * voir puisqu'ils n'existent que dans un navigateur réel.
 */

test("l'accueil se charge et affiche la marque", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Gremah Anatomy/);
  await expect(page.getByRole("link", { name: /Gremah/i }).first()).toBeVisible();
});

test("le thème bascule entre clair et sombre", async ({ page }) => {
  await page.goto("/");
  const root = page.locator("html");
  const avant = await root.getAttribute("data-theme");

  await page.getByRole("button", { name: /changer de thème/i }).click();
  await expect(root).not.toHaveAttribute("data-theme", avant ?? "");
});

test("les pages publiques répondent sans compte", async ({ page }) => {
  for (const chemin of [
    "/a-propos/",
    "/sources/",
    "/credits/",
    "/glossaire/",
    "/confidentialite/",
    "/mentions-legales/",
    "/cgu/",
  ]) {
    const reponse = await page.goto(chemin);
    expect(reponse?.status(), `${chemin} a répondu ${reponse?.status()}`).toBeLessThan(400);
  }
});

test("la bascule de langue change la langue de l'interface sans quitter la page", async ({
  page,
}) => {
  // Sprint 15 : la bascule ne navigue jamais — elle doit conserver la page en
  // cours (SPRINT.md, « la bascule conserve le contexte »). La langue de départ
  // n'est pas fixée ici : le navigateur de test annonce `en-US` par défaut, donc
  // la détection automatique (app/lib/i18n.ts) peut déjà avoir basculé en
  // anglais avant même le clic — seul l'aller-retour compte.
  await page.goto("/");
  const bouton = page.getByRole("button", { name: /switch language|changer de langue/i });
  const html = page.locator("html");

  // Le HTML statique arrive avant que React n'hydrate le bouton : cliquer trop
  // tôt ne fait rien puisque le gestionnaire n'est pas encore attaché. Le
  // laisser respirer plutôt que de courir après l'hydratation.
  await page.waitForTimeout(400);
  await expect(html).toHaveAttribute("lang", /^(fr|en)$/);
  const avant = await html.getAttribute("lang");

  await bouton.click();
  await expect(html).not.toHaveAttribute("lang", avant ?? "");
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4173\/$/);

  // Un second clic revient à la langue de départ : la bascule est réversible,
  // pas un aller simple.
  await bouton.click();
  await expect(html).toHaveAttribute("lang", avant ?? "");
});

test("l'atlas redirige vers la connexion sans session", async ({ page }) => {
  await page.goto("/atlas/");
  await expect(page).toHaveURL(/\/connexion\//);
  await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
});

test("le profil redirige vers la connexion sans session", async ({ page }) => {
  await page.goto("/profil/");
  await expect(page).toHaveURL(/\/connexion\//);
});

test("une route inconnue renvoie une page 404 lisible", async ({ page }) => {
  const reponse = await page.goto("/une-page-qui-n-existe-pas/");
  expect(reponse?.status()).toBe(404);
});
