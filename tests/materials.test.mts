import test from "node:test";
import assert from "node:assert/strict";
import {
  materialBudget,
  tissueForBudget,
  isViewMode,
  VIEW_MODES,
  TISSUE_DEFAULTS,
} from "../app/engine/materials/params.ts";

/**
 * La discipline des profils (CLAUDE.md §5) est une promesse de performance, pas
 * une préférence esthétique. Elle se teste.
 */

test("le profil éco ne paie aucun terme supplémentaire par pixel", () => {
  const budget = materialBudget("low");
  assert.equal(budget.subsurface, false);
  assert.equal(budget.sheen, false);
  // Le contour de sélection reste : sans lui, on ne sait plus ce qu'on a cliqué.
  assert.equal(budget.outline, true);
});

test("chaque montée de profil ajoute et ne retire jamais", () => {
  const low = materialBudget("low");
  const medium = materialBudget("medium");
  const high = materialBudget("high");
  for (const key of ["subsurface", "sheen", "outline"] as const) {
    assert.ok(!low[key] || medium[key], `medium perd ${key}`);
    assert.ok(!medium[key] || high[key], `high perd ${key}`);
  }
});

test("le budget atténue les tissus au lieu de les couper brutalement", () => {
  const eco = tissueForBudget(TISSUE_DEFAULTS, materialBudget("low"));
  const full = tissueForBudget(TISSUE_DEFAULTS, materialBudget("high"));

  assert.equal(eco.subsurfaceStrength, 0);
  assert.equal(eco.sheen, 0);
  // La teinte et la forme du lobe restent identiques d'un profil à l'autre : deux
  // étudiants qui comparent leurs écrans doivent voir la même famille de rendu.
  assert.equal(eco.subsurfaceColor, full.subsurfaceColor);
  assert.equal(eco.subsurfacePower, full.subsurfacePower);
  assert.ok(full.subsurfaceStrength > 0);
});

test("les modes de vue sont exhaustifs et validés", () => {
  assert.deepEqual([...VIEW_MODES], ["tissu", "rayon-x", "fantome"]);
  assert.equal(isViewMode("rayon-x"), true);
  assert.equal(isViewMode("infrarouge"), false);
});

test("la couleur de diffusion reste dans les rouges de la chair", () => {
  // Une valeur dérivée vers l'orange ou le rose ferait basculer tous les organes
  // dans le registre du plastique — c'est exactement ce que le SSS doit éviter.
  const [, r, g, b] = /#(\w{2})(\w{2})(\w{2})/.exec(TISSUE_DEFAULTS.subsurfaceColor)!;
  const red = parseInt(r, 16);
  assert.ok(red > parseInt(g, 16) && red > parseInt(b, 16));
});
