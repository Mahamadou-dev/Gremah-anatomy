/**
 * Paramètres des matériaux signature, indépendants du backend.
 *
 * Un seul jeu de descripteurs sert aux deux implémentations — TSL pour WebGPU,
 * injection GLSL pour WebGL2 — pour que « même API, deux chemins » ne soit pas
 * qu'une intention. Module sans dépendance : c'est ce qui rend le réglage des
 * tissus vérifiable sous `node --test`.
 */

/** Ce que l'étudiant voit : chair, radiographie, ou couche estompée. */
export type ViewMode = "tissu" | "rayon-x" | "fantome";

export const VIEW_MODES: readonly ViewMode[] = ["tissu", "rayon-x", "fantome"];

export function isViewMode(value: unknown): value is ViewMode {
  return value === "tissu" || value === "rayon-x" || value === "fantome";
}

/**
 * Réglages de diffusion sous-surfacique.
 *
 * C'est ce qui sépare un organe d'un jouet en plastique : la lumière qui traverse
 * quelques millimètres de tissu et ressort teintée par le sang. On approxime par
 * un terme de translucidité vue-dépendante — pas un vrai transport volumique,
 * qui coûterait dix fois le budget d'un téléphone d'entrée de gamme.
 */
export type TissueParams = {
  /** Couleur de la lumière ressortie du tissu. Rouge sombre pour la chair. */
  subsurfaceColor: string;
  /** Intensité du terme translucide, 0–1. */
  subsurfaceStrength: number;
  /** Étalement du lobe arrière : bas = translucidité serrée sur les bords. */
  subsurfaceDistortion: number;
  /** Puissance du lobe. Plus haut = translucidité plus concentrée. */
  subsurfacePower: number;
  /** Éclat humide sur la surface — un organe frais n'est jamais mat. */
  sheen: number;
};

export const TISSUE_DEFAULTS: TissueParams = {
  subsurfaceColor: "#b8362c",
  subsurfaceStrength: 0.55,
  subsurfaceDistortion: 0.35,
  subsurfacePower: 3.2,
  sheen: 0.22,
};

/** Réglages de la vue « radiographie » : fresnel additif, profondeur atténuée. */
export type XrayParams = {
  color: string;
  /** Puissance du fresnel : plus haut = liseré de bord plus fin. */
  edgePower: number;
  opacity: number;
};

export const XRAY_DEFAULTS: XrayParams = {
  color: "#7fd4ff",
  edgePower: 2.6,
  opacity: 0.62,
};

/** Couche non focalisée : présente pour le contexte, jamais pour la lecture. */
export type GhostParams = {
  color: string;
  opacity: number;
  edgePower: number;
};

export const GHOST_DEFAULTS: GhostParams = {
  color: "#cbbfae",
  opacity: 0.16,
  edgePower: 1.8,
};

/**
 * Discipline des profils (CLAUDE.md §5).
 *
 * `low` n'obtient que le PBR et l'ombre de contact : aucune passe, aucun terme
 * supplémentaire par pixel. Ce n'est pas une dégradation esthétique décidée à la
 * légère — c'est la seule façon de tenir 30 fps sur l'appareil de référence.
 */
export type MaterialBudget = {
  /** Terme de diffusion sous-surfacique actif. */
  subsurface: boolean;
  /** Second lobe spéculaire (aspect humide). */
  sheen: boolean;
  /** Contour animé sur la structure sélectionnée. */
  outline: boolean;
};

export function materialBudget(profile: "low" | "medium" | "high"): MaterialBudget {
  if (profile === "low") return { subsurface: false, sheen: false, outline: true };
  if (profile === "medium") return { subsurface: true, sheen: false, outline: true };
  return { subsurface: true, sheen: true, outline: true };
}

/**
 * Atténue les réglages d'un tissu selon le budget.
 *
 * Couper franchement un terme se voit comme un changement de matière ; le réduire
 * garde la même famille de rendu d'un profil à l'autre, ce qui compte quand deux
 * étudiants comparent leurs écrans sur le même cours.
 */
export function tissueForBudget(params: TissueParams, budget: MaterialBudget): TissueParams {
  return {
    ...params,
    subsurfaceStrength: budget.subsurface ? params.subsurfaceStrength : 0,
    sheen: budget.sheen ? params.sheen : 0,
  };
}
