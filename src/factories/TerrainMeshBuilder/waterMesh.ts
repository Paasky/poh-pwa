import { asColor3, terrainColorMap } from "@/assets/materials/terrains";
import { getWorldDepth, getWorldWidth } from "@/helpers/math";
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  TransformNode,
} from "@babylonjs/core";

import { Coords, waterLevel } from "@/helpers/mapTools";

export type WaterMeshHandle = {
  mesh: Mesh;
  dispose: () => void;
};

export function createWaterMesh(
  scene: Scene,
  size: Coords,
  parent?: TransformNode,
): WaterMeshHandle {
  const worldWidth = getWorldWidth(size.x);
  const worldDepth = getWorldDepth(size.y);

  const waterPlane = MeshBuilder.CreateGround(
    "terrain.water.plane",
    { width: worldWidth, height: worldDepth, subdivisions: 1 },
    scene,
  );
  if (parent) waterPlane.parent = parent;
  waterPlane.position.y = waterLevel;

  const matWater = new StandardMaterial("terrainMat.water.plane", scene);
  matWater.diffuseColor = asColor3(terrainColorMap["terrainType:ocean"]);
  matWater.specularColor = new Color3(0.85, 0.9, 1);
  matWater.specularPower = 128;
  matWater.alpha = 0.55; // slight transparency

  // Procedural dynamic textures for simple waves and sparkles
  // Higher resolution sparkle texture for crisper highlights
  const sparkleTex = createSparkleTexture(scene, 1024);

  // Subtle emissive sparkles that shimmer on top
  matWater.emissiveColor = new Color3(0.1, 0.12, 0.15);
  matWater.emissiveTexture = sparkleTex;
  (matWater.emissiveTexture as Texture).wrapU = Texture.WRAP_ADDRESSMODE;
  (matWater.emissiveTexture as Texture).wrapV = Texture.WRAP_ADDRESSMODE;

  // Tile textures across the plane
  const tilesX = Math.max(8, Math.round(worldWidth / 100));
  const tilesY = Math.max(8, Math.round(worldDepth / 100));
  // Double tiling scale to increase perceived motion scale/detail
  (matWater.emissiveTexture as Texture).uScale = tilesX * 20;
  (matWater.emissiveTexture as Texture).vScale = tilesY * 20;

  waterPlane.material = matWater;

  // Animate UV offsets to fake water movement and sparkling
  const startT = performance.now();
  const beforeRender = () => {
    // Time helpers
    const now = performance.now();
    const dt = (now - startT) / 100000; // legacy scaling for offsets
    const tSec = (now - startT) / 2000; // seconds for pulsation
    const emisTex = matWater.emissiveTexture as Texture | null;
    if (emisTex) {
      // Double speed for sparkle drift
      emisTex.uOffset = (dt * 0.28) % 1;
      emisTex.vOffset = (dt * 0.1) % 1;

      // Boost sparkle intensity dynamically (invisible to super-bright)
      const pulse = 0.5 + 0.5 * Math.sin(tSec * 3.6) + 0.3 * Math.sin(tSec * 7.1 + 1.4);
      // Clamp and scale to a strong range
      const level = Math.max(0, Math.min(2.5, pulse));
      (emisTex as Texture).level = 0.6 + level; // ~0.6..2.4
    }
  };
  scene.registerBeforeRender(beforeRender);

  const dispose = () => {
    scene.unregisterBeforeRender(beforeRender);
    sparkleTex.dispose();
    waterPlane.dispose();
  };

  return { mesh: waterPlane, dispose };
}

// Create small bright dots on black background for emissive sparkles
function createSparkleTexture(scene: Scene, size: number = 1024): DynamicTexture {
  const tex = new DynamicTexture("water.sparkle.tex", { width: size, height: size }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  // Black base (no emission) with transparent edges handled via emissive only
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, size, size);

  // Increase sparkle count for richer twinkle field
  const dotCount = 220;
  for (let i = 0; i < dotCount; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    // Wider radius range for variety (tiny pinpricks to slightly larger glints)
    const r = size * (0.002 + Math.random() * 0.01);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    // Wider alpha range to allow some dots to be barely visible and some to pop
    const a = 0.1 + Math.random() * 0.3;
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.4, `rgba(255,255,255,${a * 0.6})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.update(false);
  return tex;
}
