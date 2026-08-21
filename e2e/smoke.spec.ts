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
    "/confidentialite/",
    "/mentions-legales/",
    "/cgu/",
  ]) {
    const reponse = await page.goto(chemin);
    expect(reponse?.status(), `${chemin} a répondu ${reponse?.status()}`).toBeLessThan(400);
  }
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
