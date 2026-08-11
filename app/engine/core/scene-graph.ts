import * as THREE from "three";
import type { AnatomyRenderer } from "./renderer";
import type { QualitySettings } from "./capabilities";

/**
 * Le décor : éclairage, socle, ombre de contact, poussière d'ambiance.
 *
 * L'éclairage suit la charte « huilée » du drapeau du Niger (CLAUDE.md §6) —
 * key solaire chaude, fill vert-froid, rim orange. Ce n'est pas décoratif : c'est
 * ce qui donne aux tissus leur lecture de matière avant même le SSS du Sprint 3.
 */

export const PLINTH_Y = -2.5;
export const PLINTH_TOP = PLINTH_Y + 0.17;

export class SceneGraph {
  readonly scene = new THREE.Scene();
  readonly plinth: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  readonly contactShadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  private sunHalo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private accentLight: THREE.PointLight;
  private particles: THREE.Points | null = null;
  private environmentMap: THREE.Texture;

  constructor(renderer: AnatomyRenderer, quality: QualitySettings) {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    this.scene.add(new THREE.HemisphereLight(0xfff8ee, 0x33252d, 0.72));

    const key = new THREE.DirectionalLight(0xfff3e7, 3.5);
    key.position.set(4.8, 6.5, 6.8);
    const fill = new THREE.DirectionalLight(0xe6ecff, 1.12);
    fill.position.set(-4.5, 1.2, 5.2);
    const rim = new THREE.DirectionalLight(0xffb7a5, 1.6);
    rim.position.set(-4, 3.5, -5.5);
    const warm = new THREE.PointLight(0xff8d70, 0.72, 11, 2);
    warm.position.set(-3, -1.4, 3.5);
    this.scene.add(key, fill, rim, warm);

    // Teintée par l'organe courant : c'est le seul endroit où l'accent de la fiche
    // se propage dans la 3D.
    this.accentLight = new THREE.PointLight(0xee7c6a, 0.5, 8, 2);
    this.accentLight.position.set(2.8, 0.4, 2.8);
    this.scene.add(this.accentLight);

    this.environmentMap = renderer.prepareEnvironment(gradientProbe(quality.envMapSize));
    this.scene.environment = this.environmentMap;

    this.plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.48, 0.34, quality.profile === "low" ? 32 : 56),
      new THREE.MeshStandardMaterial({ color: 0xead7c1, roughness: 0.78, metalness: 0 }),
    );
    this.plinth.position.y = PLINTH_Y;
    this.scene.add(this.plinth);

    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.2),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.62,
        toneMapped: false,
      }),
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = PLINTH_TOP + 0.005;
    this.contactShadow.renderOrder = 1;
    this.scene.add(this.contactShadow);

    // Le disque solaire du drapeau, traité en lumière et non en aplat : un anneau
    // chaud posé au ras du socle. C'est la seule citation littérale du drapeau
    // dans la 3D, et elle passe par un dégradé — jamais par une bande de couleur.
    this.sunHalo = new THREE.Mesh(
      new THREE.RingGeometry(2.3, 3.3, quality.profile === "low" ? 32 : 64),
      new THREE.MeshBasicMaterial({
        map: sunHaloTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    this.sunHalo.rotation.x = -Math.PI / 2;
    this.sunHalo.position.y = PLINTH_TOP - 0.16;
    this.sunHalo.renderOrder = 0;
    this.scene.add(this.sunHalo);

    if (quality.particleCount > 0) this.particles = this.buildParticles(quality.particleCount);
  }

  setAccent(color: string) {
    this.accentLight.color.set(color);
  }

  private buildParticles(count: number) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 9;
      positions[i + 1] = (Math.random() - 0.5) * 6;
      positions[i + 2] = (Math.random() - 0.5) * 5 - 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xe7a18e, size: 0.013, transparent: true, opacity: 0.16 }),
    );
    this.scene.add(points);
    return points;
  }

  dispose() {
    this.sunHalo.geometry.dispose();
    this.sunHalo.material.map?.dispose();
    this.sunHalo.material.dispose();
    this.plinth.geometry.dispose();
    this.plinth.material.dispose();
    this.contactShadow.geometry.dispose();
    this.contactShadow.material.map?.dispose();
    this.contactShadow.material.dispose();
    this.particles?.geometry.dispose();
    (this.particles?.material as THREE.Material | undefined)?.dispose();
    this.environmentMap.dispose();
    this.scene.clear();
  }
}

/**
 * Une petite sonde en dégradé chaud→froid : meilleure réponse des matériaux qu'un
 * simple rig de lumières, pour un seul bake au lieu de travail par frame. Générée
 * plutôt que téléchargée — un `.hdr` coûterait plus cher que l'organe lui-même.
 */
function gradientProbe(height: number) {
  const width = Math.max(8, height / 2);
  const data = new Uint8Array(width * height * 4);
  const top = new THREE.Color(0xfff3e4);
  const bottom = new THREE.Color(0x6b4f45);
  const mixed = new THREE.Color();
  for (let y = 0; y < height; y += 1) {
    mixed.copy(bottom).lerp(top, Math.pow(1 - y / (height - 1), 0.7));
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      data[i] = mixed.r * 255;
      data[i + 1] = mixed.g * 255;
      data[i + 2] = mixed.b * 255;
      data[i + 3] = 255;
    }
  }
  const source = new THREE.DataTexture(data, width, height);
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.colorSpace = THREE.SRGBColorSpace;
  source.needsUpdate = true;
  return source;
}

/**
 * Le halo solaire : orange chaud au contact du socle, éteint vers l'extérieur.
 * Trois arrêts et non deux — la charte « huilée » proscrit les dégradés plats,
 * et deux arrêts produisent justement une transition mécanique.
 */
function sunHaloTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, size * 0.34, c, c, size * 0.5);
  gradient.addColorStop(0, "rgba(244, 163, 28, 0.55)");
  gradient.addColorStop(0.45, "rgba(224, 82, 6, 0.22)");
  gradient.addColorStop(1, "rgba(224, 82, 6, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function contactShadowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.04,
    size / 2,
    size / 2,
    size * 0.5,
  );
  gradient.addColorStop(0, "rgba(94, 62, 42, 0.62)");
  gradient.addColorStop(0.45, "rgba(94, 62, 42, 0.26)");
  gradient.addColorStop(1, "rgba(94, 62, 42, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
