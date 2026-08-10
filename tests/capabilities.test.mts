import test from "node:test";
import assert from "node:assert/strict";
import {
  detectProfile,
  qualitySettings,
  isQualityProfile,
  type DeviceSignals,
} from "../app/engine/core/capabilities.ts";

/**
 * Le classement des appareils est la seule chose du moteur qu'on peut vérifier
 * sans GPU — et c'est aussi celle qui décide si l'atlas est utilisable au Niger.
 * Elle est donc testée en dur, avec des appareils nommés plutôt que des chiffres.
 */

const BASE: DeviceSignals = {
  deviceMemory: 8,
  cores: 8,
  saveData: false,
  effectiveType: "4g",
  devicePixelRatio: 2,
  screenMin: 1440,
  coarsePointer: false,
  reducedMotion: false,
  webgpu: true,
};

const device = (overrides: Partial<DeviceSignals>): DeviceSignals => ({ ...BASE, ...overrides });

/** Le smartphone de référence : c'est lui qui définit le profil `low`. */
const ANDROID_ENTREE_DE_GAMME = device({
  deviceMemory: 2,
  cores: 4,
  effectiveType: "3g",
  devicePixelRatio: 3,
  screenMin: 360,
  coarsePointer: true,
  webgpu: false,
});

test("un Android d'entrée de gamme tombe en profil low", () => {
  assert.equal(detectProfile(ANDROID_ENTREE_DE_GAMME), "low");
});

test("un desktop récent atteint le profil high", () => {
  assert.equal(detectProfile(BASE), "high");
});

test("un milieu de gamme se stabilise en medium", () => {
  const midrange = device({
    deviceMemory: 4,
    cores: 8,
    devicePixelRatio: 2.5,
    screenMin: 412,
    coarsePointer: true,
    webgpu: false,
  });
  assert.equal(detectProfile(midrange), "medium");
});

test("saveData impose low même sur une machine puissante", () => {
  assert.equal(detectProfile(device({ saveData: true })), "low");
});

test("une connexion 2G impose low", () => {
  assert.equal(detectProfile(device({ effectiveType: "2g" })), "low");
  assert.equal(detectProfile(device({ effectiveType: "slow-2g" })), "low");
});

test("un navigateur avare en signaux ne bascule pas en high par défaut", () => {
  const unknown = device({ deviceMemory: null, cores: null, effectiveType: null, webgpu: false });
  assert.equal(detectProfile(unknown), "medium");
});

test("low reste le profil le plus léger sur chaque réglage", () => {
  const low = qualitySettings("low");
  const medium = qualitySettings("medium");
  const high = qualitySettings("high");

  assert.ok(low.maxPixelRatio <= medium.maxPixelRatio);
  assert.ok(medium.maxPixelRatio <= high.maxPixelRatio);
  assert.ok(low.particleCount <= medium.particleCount);
  assert.ok(low.maxAnisotropy <= medium.maxAnisotropy);
  // Aucune passe de post-processing sur `low` : c'est la règle du Sprint 3.
  assert.deepEqual(low.passes, { bloom: false, ssao: false, dof: false });
  assert.equal(low.lodBias, 2);
});

test("isQualityProfile rejette une valeur de localStorage corrompue", () => {
  assert.equal(isQualityProfile("high"), true);
  assert.equal(isQualityProfile("ultra"), false);
  assert.equal(isQualityProfile(null), false);
});
