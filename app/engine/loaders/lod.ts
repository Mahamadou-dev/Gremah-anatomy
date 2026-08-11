/**
 * Niveaux de détail et budget mémoire.
 *
 * Module sans dépendance : c'est la partie du pipeline d'assets qu'on peut
 * vérifier sous `node --test`, et c'est celle qui décide si un étudiant en 3G
 * voit un organe en une seconde ou en quinze.
 *
 * Les fichiers sont produits par `scripts/optimize-models.mjs` :
 *   heart.glb (niveau 0) · heart-lod1.glb · heart-lod2.glb
 */

export type LodLevel = 0 | 1 | 2;

export const LOD_SUFFIX: Record<LodLevel, string> = {
  0: "",
  1: "-lod1",
  2: "-lod2",
};

/** Le niveau le plus léger : celui qu'on affiche toujours en premier. */
export const PREVIEW_LEVEL: LodLevel = 2;

/** `/models/heart.glb` + niveau 1 → `/models/heart-lod1.glb`. */
export function lodUrl(baseUrl: string, level: LodLevel): string {
  if (level === 0) return baseUrl;
  return baseUrl.replace(/\.glb$/i, `${LOD_SUFFIX[level]}.glb`);
}

/** Retrouve l'URL de base à partir de n'importe quel niveau — clé de cache stable. */
export function baseUrlOf(url: string): string {
  return url.replace(/-lod[12](\.glb)$/i, "$1");
}

/**
 * Niveau visé pour un profil de qualité et une distance caméra.
 *
 * Le `lodBias` du profil fixe le plancher : sur un Android d'entrée de gamme on ne
 * charge jamais le niveau 0, quelle que soit la distance. En s'approchant, on ne
 * peut que raffiner — jamais dépasser ce que l'appareil supporte.
 */
export function selectLevel(lodBias: 0 | 1 | 2, distance: number): LodLevel {
  // Bornes exprimées en unités de scène : l'organe fait FIT_SIZE = 3.8 de large,
  // et les contrôles bornent la distance entre 4,8 et 12.
  const byDistance: LodLevel = distance > 10 ? 2 : distance > 7.5 ? 1 : 0;
  return Math.max(byDistance, lodBias) as LodLevel;
}

/**
 * Budget mémoire GPU alloué aux organes en cache, en octets.
 *
 * Le LRU fixe à trois entrées mentait sur son coût : trois organes lourds peuvent
 * peser six fois plus que trois organes légers. On compte donc des octets. Les
 * valeurs sont volontairement prudentes — dépasser la mémoire d'un téléphone ne
 * ralentit pas l'application, il la fait tuer par le système.
 */
export function memoryBudgetBytes(deviceMemoryGb: number | null, coarsePointer: boolean): number {
  const MB = 1024 * 1024;
  if (deviceMemoryGb !== null) {
    if (deviceMemoryGb <= 2) return 45 * MB;
    if (deviceMemoryGb <= 4) return 90 * MB;
    if (deviceMemoryGb >= 8) return 180 * MB;
    return 120 * MB;
  }
  // Sans `deviceMemory` (Safari, Firefox), le type de pointeur est le seul indice
  // disponible : on suppose le mobile plutôt que le desktop.
  return coarsePointer ? 60 * MB : 120 * MB;
}

/**
 * Coût mémoire estimé d'un organe chargé.
 *
 * La taille du fichier sous-estime largement l'empreinte : la géométrie est
 * décompressée en VRAM et les textures y sont stockées non compressées, mipmaps
 * comprises. Ce facteur n'est pas exact — il est cohérent, ce qui suffit à une
 * politique d'éviction.
 */
export function estimateResidentBytes(fileBytes: number): number {
  return Math.round(fileBytes * 3.2);
}
