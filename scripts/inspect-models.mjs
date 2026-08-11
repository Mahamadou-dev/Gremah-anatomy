#!/usr/bin/env node
/**
 * Où partent les mégaoctets ? Géométrie ou textures ?
 *
 * On ne choisit pas une stratégie de compression avant de savoir ça : quantifier
 * des positions ne sert à rien si 90 % du poids est dans un PNG 4K.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import draco3d from "draco3dgltf";

const DIR = "public/models";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder,
  "meshopt.encoder": MeshoptEncoder,
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2).padStart(6);

let totals = { file: 0, texture: 0, vertices: 0, triangles: 0 };

for (const name of readdirSync(DIR).filter((f) => f.endsWith(".glb"))) {
  const path = join(DIR, name);
  const bytes = statSync(path).size;
  const document = await io.read(path);
  const root = document.getRoot();

  const textureBytes = root
    .listTextures()
    .reduce((sum, texture) => sum + (texture.getImage()?.byteLength ?? 0), 0);

  let vertices = 0;
  let triangles = 0;
  for (const mesh of root.listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute("POSITION");
      vertices += position?.getCount() ?? 0;
      const indices = primitive.getIndices();
      triangles += (indices ? indices.getCount() : (position?.getCount() ?? 0)) / 3;
    }
  }

  const extensions = root
    .listExtensionsUsed()
    .map((e) => e.extensionName)
    .join(", ");
  console.log(
    `${name.padEnd(15)} ${mb(bytes)} Mo  textures ${mb(textureBytes)} Mo  ` +
      `${String(root.listTextures().length).padStart(2)} tex  ` +
      `${Math.round(triangles).toLocaleString("fr-FR").padStart(9)} tri  ${extensions}`,
  );

  totals.file += bytes;
  totals.texture += textureBytes;
  totals.vertices += vertices;
  totals.triangles += triangles;
}

console.log(
  `\nTOTAL           ${mb(totals.file)} Mo  textures ${mb(totals.texture)} Mo  ` +
    `${Math.round(totals.triangles).toLocaleString("fr-FR")} triangles`,
);
