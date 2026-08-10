import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "next-env.d.ts",
    // Décodeurs WASM tiers (Draco, Basis) livrés minifiés : rien à y corriger.
    "public/draco/**",
    "public/basis/**",
  ]),
  {
    rules: {
      // L'export statique désactive l'optimiseur d'images de Next : `next/image`
      // n'apporterait rien ici. Les illustrations sont déjà en .webp dimensionné.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
