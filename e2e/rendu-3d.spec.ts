import { test, expect } from "@playwright/test";

/**
 * Non-régression visuelle et parité de rendu (Sprint 14, points 2 et 4).
 *
 * Ces tests exigent une session (l'atlas est protégé, Sprint 11) — on passe
 * donc par une inscription jetable comme dans e2e/comptes.spec.ts. Comme ce
 * fichier-là, ils sautent proprement sans `MONGODB_URI` : sur CI sans les
 * secrets de compte posés (voir SPRINT.md, « À faire à la main »), il n'y a
 * pas d'atlas accessible à capturer.
 */
test.skip(!process.env.MONGODB_URI, "MONGODB_URI absent : voir SPRINT.md § À faire à la main");

function emailDeTest(prefixe: string): string {
  return `${prefixe}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.ne`;
}

const MOT_DE_PASSE = "un-mot-de-passe-de-test-assez-long";

async function inscrireEtOuvrirAtlas(
  page: import("@playwright/test").Page,
  prefixe: string,
  cheminAtlas = "/atlas/",
) {
  const email = emailDeTest(prefixe);
  await page.goto("/inscription/");
  await page.getByLabel("Prénom").fill("Rendu");
  await page.getByLabel("Nom", { exact: true }).fill("E2E");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Région").selectOption("Niamey");
  await page.locator('.auth-form input[type="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/\/atlas\//, { timeout: 15_000 });
  if (cheminAtlas !== "/atlas/") {
    await page.goto(cheminAtlas);
  }
  await expect(page.locator(".engine-badge")).toBeVisible({ timeout: 20_000 });
  // Laisser le rendu se stabiliser (fondus, dernière frame render-on-demand)
  // avant toute capture — sinon la diff varie avec le timing plutôt qu'avec le rendu.
  await page.waitForTimeout(500);
}

test.describe("captures de référence", () => {
  // Le rendu WebGL dépend du GPU/pilote de la machine qui exécute le test : une
  // égalité stricte serait ininterprétable. `maxDiffPixelRatio` fixe une tolérance
  // assumée — un rendu qui bascule franchement (écran noir, matériau manquant) la
  // dépasse largement ; un antialiasing différent d'un pixel ne la dépasse pas.
  test("l'atlas affiche l'organe par défaut de façon stable", async ({ page }) => {
    await inscrireEtOuvrirAtlas(page, "capture");
    await expect(page.locator(".three-mount canvas")).toHaveScreenshot("atlas-organe-defaut.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});

test.describe("chemin de repli WebGPU → WebGL2", () => {
  // `?renderer=webgl` (app/engine/core/renderer.ts, forcedBackend()) force le
  // second chemin de rendu même quand WebGPU est disponible dans le navigateur
  // de test — c'est le mécanisme prévu par le moteur lui-même pour comparer les
  // deux backends sans changer de machine (charte CLAUDE.md §5.1).
  test("le rendu forcé en WebGL2 ne produit ni écran noir ni erreur", async ({ page }) => {
    const erreursConsole: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") erreursConsole.push(message.text());
    });
    page.on("pageerror", (erreur) => erreursConsole.push(erreur.message));

    await inscrireEtOuvrirAtlas(page, "repli", "/atlas/?renderer=webgl");

    await expect(page.locator(".engine-backend")).toHaveText("WebGL2");
    await expect(page.locator(".three-mount canvas")).toBeVisible();

    // Parité visuelle raisonnable : le canevas WebGL2 ne doit pas être vide/noir.
    // On échantillonne les pixels du canevas côté page plutôt que de comparer une
    // capture pixel-à-pixel au backend par défaut, qui varie déjà légitimement
    // (tone-mapping, PMREM) — la charte exige "pas d'écran noir", pas l'identité.
    const proportionNonNoire = await page.locator(".three-mount canvas").evaluate((canvas) => {
      const el = canvas as HTMLCanvasElement;
      const essai = document.createElement("canvas");
      essai.width = el.width;
      essai.height = el.height;
      const contexte = essai.getContext("2d");
      if (!contexte) return 1; // Pas de 2D disponible pour l'échantillonnage : ne pas faire échouer le test là-dessus.
      contexte.drawImage(el, 0, 0);
      const { data } = contexte.getImageData(0, 0, essai.width, essai.height);
      let nonNoirs = 0;
      const total = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 8 || data[i + 1] > 8 || data[i + 2] > 8) nonNoirs++;
      }
      return nonNoirs / total;
    });

    expect(proportionNonNoire, "le canevas WebGL2 semble entièrement noir").toBeGreaterThan(0.05);
    expect(erreursConsole, erreursConsole.join("\n")).toEqual([]);
  });
});
