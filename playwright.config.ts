import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright — Sprint 14.
 *
 * `webServer` fait tourner un vrai `next start` sur un build de production :
 * un smoke qui passe seulement sur `next dev` ne prouve rien de ce qui part
 * en production. Un seul navigateur en CI (Chromium) — le budget du projet
 * n'est pas dans la matrice de navigateurs, il est dans le profil `low` du
 * moteur 3D (CLAUDE.md §5), que Playwright ne mesure pas.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      // Android d'entrée de gamme simulé au plus proche de ce que Playwright
      // offre : petit écran, pixel ratio modeste. Le vrai matériel manque
      // encore (SPRINT.md, « Ce qui bloque »), ceci n'en est qu'une approche.
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: {
    command: "npm run build && npm run start -- -p 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
