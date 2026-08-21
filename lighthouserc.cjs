/**
 * Budget de performance en CI (Sprint 14, point 5).
 *
 * Cible `/` (l'accueil, la première preuve de sérieux du site — §11 de
 * CLAUDE.md) et `/atlas/`. Sans session — les secrets `MONGODB_URI` /
 * `AUTH_SECRET` ne sont pas encore posés côté GitHub Actions, voir SPRINT.md,
 * « À faire à la main » — `/atlas/` redirige vers `/connexion/` : c'est donc
 * cette page-là qui est mesurée pour l'instant. C'est un budget honnête sur ce
 * que peut réellement charger la CI aujourd'hui, pas une triche : le jour où
 * les secrets sont posés, ce fichier peut viser une URL post-connexion sans
 * changer sa forme.
 *
 * `@lhci/cli` est la seule nouvelle dépendance ajoutée pour ce point du sprint
 * (avec `@axe-core/playwright` pour l'accessibilité) : c'est l'outillage
 * officiel de Google pour faire échouer un build sur un budget Lighthouse,
 * plus léger qu'un service tiers et sans compte à créer.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: null,
      url: ["http://127.0.0.1:4174/", "http://127.0.0.1:4174/atlas/"],
      numberOfRuns: 1,
      // Un port distinct de celui de Playwright (4173) : les deux chaînes de CI
      // peuvent tourner dans le même job sans se disputer le port.
      startServerCommand: "npm run start -- -p 4174",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 60_000,
      settings: {
        preset: "desktop",
        skipAudits: ["uses-http2"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.85 }],
        // Le SEO n'est pas un objectif du cahier de charge (frontend-only,
        // audience via le bouche-à-oreille et les cursus) : mesuré, pas bloquant.
        "categories:seo": "off",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
