/**
 * Sondage de capacités et profils de qualité.
 *
 * Ce module est volontairement sans dépendance — ni three, ni React, ni DOM au
 * niveau des fonctions pures. C'est ce qui permet de le tester sous `node --test`
 * et de vérifier le classement des appareils sans ouvrir un navigateur.
 *
 * La cible de référence n'est pas un écran de démo : c'est un Android d'entrée de
 * gamme à ~150 000 FCFA. Le profil `low` doit y tenir 30 fps.
 */

export type QualityProfile = "low" | "medium" | "high";

/** Ce qu'on sait de la machine, extrait du navigateur par `readSignals()`. */
export type DeviceSignals = {
  /** `navigator.deviceMemory` en Go, `null` si le navigateur ne l'expose pas. */
  deviceMemory: number | null;
  /** `navigator.hardwareConcurrency`, `null` si absent. */
  cores: number | null;
  /** `navigator.connection.saveData` — l'étudiant a demandé l'économie de données. */
  saveData: boolean;
  /** Type de connexion effectif : "slow-2g" | "2g" | "3g" | "4g" | null. */
  effectiveType: string | null;
  devicePixelRatio: number;
  /** Plus petite dimension de l'écran en pixels CSS. */
  screenMin: number;
  /** Pointeur grossier = doigt = mobile ou tablette dans la quasi-totalité des cas. */
  coarsePointer: boolean;
  /** L'utilisateur a demandé moins d'animations. */
  reducedMotion: boolean;
  /** WebGPU annoncé par le navigateur. */
  webgpu: boolean;
};

/** Tous les réglages qu'un profil pilote. Un seul endroit à lire dans le moteur. */
export type QualitySettings = {
  profile: QualityProfile;
  /** Plafond du pixel ratio. Décidé une fois, jamais adapté en vol (voir renderer.ts). */
  maxPixelRatio: number;
  antialias: boolean;
  /** Anisotropie maximale demandée aux textures. */
  maxAnisotropy: number;
  /** Taille de la sonde d'environnement équirectangulaire. */
  envMapSize: number;
  /** Nombre de particules d'ambiance. 0 = aucune. */
  particleCount: number;
  /** Niveau de détail visé : 0 = pleine densité, 2 = le plus léger (Sprint 2). */
  lodBias: 0 | 1 | 2;
  /** Budget CPU par frame, en millisecondes. Sert de seuil d'alerte à l'overlay. */
  frameBudgetMs: number;
  /** Passes de post-processing autorisées (Sprint 3). */
  passes: { bloom: boolean; ssao: boolean; dof: boolean };
};

const PROFILES: Record<QualityProfile, Omit<QualitySettings, "profile">> = {
  low: {
    maxPixelRatio: 1,
    antialias: false,
    maxAnisotropy: 1,
    envMapSize: 16,
    particleCount: 0,
    lodBias: 2,
    frameBudgetMs: 12,
    passes: { bloom: false, ssao: false, dof: false },
  },
  medium: {
    maxPixelRatio: 1.5,
    antialias: true,
    maxAnisotropy: 4,
    envMapSize: 32,
    particleCount: 48,
    lodBias: 1,
    frameBudgetMs: 8,
    passes: { bloom: true, ssao: true, dof: false },
  },
  high: {
    maxPixelRatio: 2,
    antialias: true,
    maxAnisotropy: 8,
    envMapSize: 64,
    particleCount: 96,
    lodBias: 0,
    frameBudgetMs: 8,
    passes: { bloom: true, ssao: true, dof: true },
  },
};

export const QUALITY_PROFILES: readonly QualityProfile[] = ["low", "medium", "high"];

export function isQualityProfile(value: unknown): value is QualityProfile {
  return value === "low" || value === "medium" || value === "high";
}

/**
 * Classe l'appareil à partir de ses signaux.
 *
 * Le score part de zéro et chaque indice le pousse. On ne peut pas mesurer le GPU
 * sans rendre une frame, donc on s'appuie sur ce qui corrèle avec lui : mémoire,
 * cœurs, densité d'écran, nature du pointeur.
 *
 * `saveData` et une connexion 2G court-circuitent tout : quelqu'un qui compte ses
 * mégaoctets ne veut pas d'un profil `high`, même sur un bon téléphone.
 */
export function detectProfile(signals: DeviceSignals): QualityProfile {
  if (signals.saveData) return "low";
  if (signals.effectiveType === "slow-2g" || signals.effectiveType === "2g") return "low";

  let score = 0;

  if (signals.deviceMemory !== null) {
    if (signals.deviceMemory <= 2) score -= 3;
    else if (signals.deviceMemory <= 4) score -= 1;
    else if (signals.deviceMemory >= 8) score += 2;
  }

  if (signals.cores !== null) {
    if (signals.cores <= 4) score -= 2;
    else if (signals.cores >= 8) score += 2;
  }

  // Un pointeur grossier sur un petit écran : téléphone. Le budget thermique y est
  // le vrai plafond, bien avant la puissance brute.
  if (signals.coarsePointer) score -= 1;
  if (signals.screenMin <= 480) score -= 2;
  else if (signals.screenMin >= 1000) score += 1;

  // Une forte densité coûte cher au fillrate ; sur un appareil déjà faible c'est
  // la combinaison qui tue, d'où la pénalité conditionnelle.
  if (signals.devicePixelRatio >= 3 && score < 0) score -= 1;

  // WebGPU n'est pas une preuve de puissance, mais aucun appareil d'entrée de
  // gamme de 2020 ne l'expose : c'est un indice de modernité du couple GPU/pilote.
  if (signals.webgpu) score += 1;

  if (score <= -3) return "low";
  if (score >= 3) return "high";
  return "medium";
}

/** Les réglages complets d'un profil. */
export function qualitySettings(profile: QualityProfile): QualitySettings {
  return { profile, ...PROFILES[profile] };
}

/** Lit les signaux du navigateur. Seul point de contact avec les API globales. */
export function readSignals(): DeviceSignals {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const media = (query: string) =>
    typeof window.matchMedia === "function" && window.matchMedia(query).matches;

  return {
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    saveData: nav.connection?.saveData === true,
    effectiveType: nav.connection?.effectiveType ?? null,
    devicePixelRatio: window.devicePixelRatio || 1,
    screenMin: Math.min(window.screen?.width ?? 1280, window.screen?.height ?? 800),
    coarsePointer: media("(pointer: coarse)"),
    reducedMotion: media("(prefers-reduced-motion: reduce)"),
    webgpu: typeof navigator !== "undefined" && "gpu" in navigator,
  };
}

const STORAGE_KEY = "gremah.quality";

/** Surcharge choisie par l'utilisateur, ou `null` s'il laisse la détection décider. */
export function readQualityOverride(): QualityProfile | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isQualityProfile(stored) ? stored : null;
  } catch {
    // Navigation privée ou stockage bloqué : la détection reprend la main.
    return null;
  }
}

export function writeQualityOverride(profile: QualityProfile | null) {
  try {
    if (profile === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, profile);
  } catch {
    // Sans persistance le choix vaut pour la session — acceptable, pas bloquant.
  }
}

/** Profil effectif : la surcharge utilisateur gagne toujours sur la détection. */
export function resolveQuality(signals: DeviceSignals = readSignals()): {
  settings: QualitySettings;
  detected: QualityProfile;
  override: QualityProfile | null;
  signals: DeviceSignals;
} {
  const detected = detectProfile(signals);
  const override = readQualityOverride();
  return { settings: qualitySettings(override ?? detected), detected, override, signals };
}
