/**
 * Contrat commun aux deux piles de post-processing.
 *
 * WebGL2 passe par `EffectComposer`, WebGPU par le système de nœuds de three :
 * les deux API n'ont rien en commun, mais le viewer ne doit connaître ni l'une
 * ni l'autre. Il programme contre cette interface, exactement comme il programme
 * contre `AnatomyRenderer` sans savoir quel backend tourne.
 */

export type PostStatus = {
  /** Vrai si le rendu passe réellement par la pile. */
  available: boolean;
  /** Pourquoi elle est absente, le cas échéant. Affiché par `?debug=1`. */
  reason: string | null;
  passes: string[];
};

export interface PostBackend {
  readonly status: PostStatus;
  setSize(width: number, height: number): void;
  /**
   * Distance de mise au point, en unités de scène, ou `null` pour couper la
   * profondeur de champ. Appelé quand un point d'intérêt est sélectionné.
   */
  setFocus(distance: number | null): void;
  /** Retourne `true` si la pile a rendu ; sinon l'appelant rend en direct. */
  render(delta: number): boolean;
  dispose(): void;
}

/** `?passes=0` coupe la pile — le premier réflexe quand un rendu est suspect. */
export function passesRequested(): boolean {
  if (typeof window === "undefined") return true;
  return new URLSearchParams(window.location.search).get("passes") !== "0";
}

/**
 * Ouverture du diaphragme simulé.
 *
 * Volontairement faible : une profondeur de champ marquée est spectaculaire sur
 * une capture d'écran et nuisible sur un atlas, où les rapports anatomiques —
 * ce que l'organe touche, ce qui passe derrière — sont précisément ce qu'un
 * étudiant doit voir. Le flou signale la mise au point, il ne cache rien.
 */
export const OUVERTURE = 0.0016;

/** Flou maximal, borné pour la même raison. */
export const FLOU_MAX = 0.006;
