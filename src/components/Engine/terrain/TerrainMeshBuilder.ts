/*
TerrainMeshBuilder – merged hex terrain surface

Purpose
- Build a single Babylon mesh representing the hex grid top surface with smoothed heights
  and per-vertex colors based on terrain types.

Notes
- Pointy-top hexes, odd-r layout, wrap east/west.
- For MVP: we generate top faces only (no side skirts) and rely on consistent rim heights
  across neighbors (averaging with neighbor heights) to avoid gaps.
*/

import { useObjectsStore } from "@/stores/objectStore";
import type { WorldState } from "@/types/common";
import { Tile } from "@/objects/game/Tile";
import {
  getWorldDepth,
  getWorldMinX,
  getWorldMinZ,
  getWorldWidth,
  hexDepth,
  hexWidth,
} from "@/components/Engine/math";
import { CompassHexEdge, getHexEdgeNeighborDirections } from "@/helpers/mapTools";
import { Color3, Color4, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, } from "@babylonjs/core";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { terrainColorMap } from "@/assets/materials/terrains";
import { ElevationBlender } from "@/components/Engine/terrain/ElevationBlender";

export type TerrainBuildOptions = {
  hexRadius?: number; // default 1
  smoothing?: number; // 0..1 (passed to ElevationBlender)
  jitter?: number; // noise amplitude for heights
};

export class TerrainMeshBuilder {
  private readonly scene: Scene;
  private readonly world: WorldState;
  private opts: Required<TerrainBuildOptions>;
  private root: TransformNode | null = null;
  private mesh: Mesh | null = null;
  private tilesByKey: Record<string, Tile> = {};
  private blender: ElevationBlender;

  constructor(scene: Scene, world: WorldState, options?: TerrainBuildOptions) {
    this.scene = scene;
    this.world = world;
    this.opts = {
      hexRadius: options?.hexRadius ?? 1,
      smoothing: options?.smoothing ?? 0.6,
      jitter: options?.jitter ?? 0.04,
    } as Required<TerrainBuildOptions>;

    // todo new objStore getter: tilesByKey
    const objStore = useObjectsStore();
    const tiles = objStore.getClassGameObjects("tile") as Tile[];
    for (const t of tiles) this.tilesByKey[t.key] = t;

    this.blender = new ElevationBlender(this.world, {
      smoothing: this.opts.smoothing,
      jitter: this.opts.jitter,
    });
  }

  build(): TransformNode {
    if (this.root) this.dispose();
    this.root = new TransformNode("terrainRoot", this.scene);

    const s = this.opts.hexRadius;
    const angleDeg: number[] = [30, 90, 150, 210, 270, 330]; // pointy-top hex rim angles
    const angleRad = angleDeg.map((a) => (a * Math.PI) / 180);

    // Heights: for corner-based blending we use base heights directly
    // (no pre-smoothed map) to avoid cross-tile feedback.

    // Single buffers for all tiles (land + water) — KISS
    const positions: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];

    // World placement offsets
    const worldWidth = getWorldWidth(this.world.sizeX);
    const worldDepth = getWorldDepth(this.world.sizeY);
    const offsetX = getWorldMinX(worldWidth);
    const offsetZ = getWorldMinZ(worldDepth);

    const colorOf = (t: Tile): Color3 => terrainColorMap[t.terrain.key] ?? Color3.Purple();

    // todo move to mapTools
    const isSaltWater = (t: Tile): boolean => {
      const k = t.terrain.key as string;
      return k === "terrainType:ocean" || k === "terrainType:sea" || k === "terrainType:coast";
    };
    const isFreshWater = (t: Tile): boolean => {
      const k = t.terrain.key as string;
      return k === "terrainType:lake" || k === "terrainType:majorRiver";
    };
    const isWater = (t: Tile): boolean => isSaltWater(t) || isFreshWater(t);

    const beachColor = terrainColorMap["terrainType:desert"];
    const riverBankColor = terrainColorMap["terrainType:grass"];
    const rocksColor = terrainColorMap["terrainType:rocks"];

    const vertex = (x: number, y: number, z: number, c: Color4) => {
      positions.push(x, y, z);
      colors.push(c.r, c.g, c.b, c.a);
    };

    // Iterate tiles row-major
    for (let y = 0; y < this.world.sizeY; y++) {
      for (let x = 0; x < this.world.sizeX; x++) {
        const tile = this.tilesByKey[Tile.getKey(x, y)];
        if (!tile) continue;

        // Center position of this tile (odd-r layout)
        // todo move to math
        const cx = offsetX + hexWidth * (x + 0.5 * (y & 1));
        const cz = offsetZ + hexDepth * y;

        const hCenter = this.blender.sampleBaseHeight(x, y);
        const cCenter3 = colorOf(tile);
        const cCenter = new Color4(cCenter3.r, cCenter3.g, cCenter3.b, 1);

        const ring: { x: number; z: number; h: number; color: Color4 }[] = [];
        // Corner order matching angleRad: 30°, 90°, 150°, 210°, 270°, 330°
        // Note: +Z grows south in our world space, so the N/S labels must be flipped
        // relative to mathematical angles. The correct edge order for our angles is:
        //   30°→se, 90°→s, 150°→sw, 210°→nw, 270°→n, 330°→ne
        const edges: CompassHexEdge[] = ["se", "s", "sw", "nw", "n", "ne"];
        for (let i = 0; i < 6; i++) {
          const a = angleRad[i];
          const rx = cx + Math.cos(a) * s;
          const rz = cz + Math.sin(a) * s;

          // Get the two neighbor deltas for this corner
          const [dA, dB] = getHexEdgeNeighborDirections(y, edges[i]);

          // Resolve neighbor coords with wrap/clamp rules
          const resolve = (dx: number, dy: number): { x: number; y: number } => {
            let nx = x + dx;
            const ny = y + dy;
            if (ny < 0 || ny >= this.world.sizeY) return { x, y };
            nx = ((nx % this.world.sizeX) + this.world.sizeX) % this.world.sizeX;
            return { x: nx, y: ny };
          };

          const nA = resolve(dA.x, dA.y);
          const nB = resolve(dB.x, dB.y);

          const hA = this.blender.sampleBaseHeight(nA.x, nA.y);
          const hB = this.blender.sampleBaseHeight(nB.x, nB.y);
          let hRim = (hCenter + hA + hB) / 3;

          const tA = this.tilesByKey[Tile.getKey(nA.x, nA.y)] ?? tile;
          const tB = this.tilesByKey[Tile.getKey(nB.x, nB.y)] ?? tile;

          // Determine corner color (land-water rule: land colors dominate on land mesh)
          let cRim3: Color3;
          if (!isWater(tile)) {
            // LAND TILE: handle coasts specially to avoid blue blending
            const hasSalt = isSaltWater(tA) || isSaltWater(tB);
            const hasFresh = isFreshWater(tA) || isFreshWater(tB);
            if (hasSalt || hasFresh) {
              // Mix land with water neighbors: choose beach/grass vs rocks by elevation diff
              let waterH = 0;
              let wCount = 0;
              if (isWater(tA)) {
                waterH += this.blender.sampleBaseHeight(nA.x, nA.y);
                wCount++;
              }
              if (isWater(tB)) {
                waterH += this.blender.sampleBaseHeight(nB.x, nB.y);
                wCount++;
              }
              const avgWaterH = wCount ? waterH / wCount : hCenter;
              const elevDiff = Math.abs(hCenter - avgWaterH);
              if (hasSalt && !hasFresh) {
                cRim3 = elevDiff < 0.5 ? beachColor : rocksColor;
              } else if (hasFresh && !hasSalt) {
                cRim3 = elevDiff < 0.5 ? riverBankColor : rocksColor;
              } else {
                cRim3 = elevDiff < 0.5 ? beachColor : rocksColor;
              }
            } else {
              // Pure land corner: average of the three land colors
              const cA = colorOf(tA);
              const cB = colorOf(tB);
              cRim3 = new Color3(
                (cCenter3.r + cA.r + cB.r) / 3,
                (cCenter3.g + cA.g + cB.g) / 3,
                (cCenter3.b + cA.b + cB.b) / 3,
              );
            }
          } else {
            // WATER TILE: blend water colors at corners (average self + water neighbors only).
            // Do not let land colors bleed into water.
            // Also clamp rim height so water never rises above sea level (slightly below 0)
            hRim = Math.min(hRim, -0.02);

            const waterColors: Color3[] = [cCenter3];
            if (isWater(tA)) waterColors.push(colorOf(tA));
            if (isWater(tB)) waterColors.push(colorOf(tB));

            if (waterColors.length > 1) {
              let r = 0,
                g = 0,
                b = 0;
              for (const wc of waterColors) {
                r += wc.r;
                g += wc.g;
                b += wc.b;
              }
              cRim3 = new Color3(r / waterColors.length, g / waterColors.length, b / waterColors.length);
            } else {
              cRim3 = cCenter3;
            }
          }

          const cRim = new Color4(cRim3.r, cRim3.g, cRim3.b, 1);
          ring.push({ x: rx, z: rz, h: hRim, color: cRim });
        }

        // Emit vertices: center + 6 rim into the single buffer
        const baseIndex = positions.length / 3;
        vertex(cx, hCenter, cz, cCenter);
        for (const rv of ring) vertex(rv.x, rv.h, rv.z, rv.color);

        // Triangulate fan (center, i, i+1)
        for (let i = 0; i < 6; i++) {
          const i0 = baseIndex; // center
          const i1 = baseIndex + 1 + i;
          const i2 = baseIndex + 1 + ((i + 1) % 6);
          indices.push(i0, i1, i2);
        }
      }
    }

    // Build a single mesh for all tiles
    const tiles = new Mesh("terrain.tiles", this.scene);
    const vd = new VertexData();
    vd.positions = positions;
    vd.indices = indices;
    vd.colors = colors;
    const normals: number[] = [];
    if (positions.length && indices.length) VertexData.ComputeNormals(positions, indices, normals);
    vd.normals = normals;
    vd.applyToMesh(tiles, true);
    const matTiles = new StandardMaterial("terrainMat.tiles", this.scene);
    // Keep tiles matte; specular comes from water plane only
    matTiles.specularColor = Color3.Black();
    tiles.material = matTiles;
    tiles.parent = this.root;

    // Simple world-sized water plane to denote global sea level
    const waterPlane = MeshBuilder.CreateGround(
      "terrain.water.plane",
      { width: worldWidth, height: worldDepth, subdivisions: 1 },
      this.scene,
    );
    // Place below ground level (y=0)
    waterPlane.position.y = -0.2;
    const matWater = new StandardMaterial("terrainMat.water.plane", this.scene);
    matWater.diffuseColor = terrainColorMap["terrainType:ocean"];
    // Make plane reflective to the sun, semi-transparent for global sea level hint
    matWater.specularColor = new Color3(0.8, 0.85, 0.95);
    matWater.specularPower = 128;
    matWater.alpha = 0.5; // 50% opacity
    waterPlane.material = matWater;
    waterPlane.parent = this.root;

    // Keep reference to tiles mesh as primary
    this.mesh = tiles;
    return this.root;
  }

  // noinspection JSUnusedGlobalSymbols
  getMesh(): Mesh | null {
    return this.mesh;
  }

  dispose(): void {
    if (this.mesh) this.mesh.dispose(false, true);
    if (this.root) this.root.dispose(false, true);
    this.mesh = null;
    this.root = null;
  }
}
