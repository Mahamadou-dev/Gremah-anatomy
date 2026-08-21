import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Filet automatique entre deux audits manuels (Sprint 10), pas un remplacement.
 * `@axe-core/playwright` couvre ce qui se détecte mécaniquement — contraste,
 * labels, rôles ARIA, structure de titres — pas le jugement d'un audit humain.
 *
 * Routes publiques uniquement ici : /atlas et /profil exigent une session
 * (voir e2e/comptes.spec.ts) et se sautent déjà sans `MONGODB_URI` en CI.
 */

const ROUTES_PUBLIQUES = [
  "/",
  "/a-propos/",
  "/sources/",
  "/credits/",
  "/confidentialite/",
  "/mentions-legales/",
  "/cgu/",
];

for (const route of ROUTES_PUBLIQUES) {
  test(`accessibilité automatisée : ${route}`, async ({ page }) => {
    await page.goto(route);
    const resultats = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(
      resultats.violations,
      resultats.violations
        .map(
          (v) =>
            `${v.id} (${v.impact}) — ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
        )
        .join("\n\n"),
    ).toEqual([]);
  });
}
