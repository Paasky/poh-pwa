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
import { CompassHex, getHexNeighborDirections } from "@/helpers/mapTools";
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

    // Precompute heights for speed
    this.blender.precomputeAll();
    const heightMap = this.blender.getHeightMap();

    // Buffers: land only (water is a single world plane for now)
    const positionsLand: number[] = [];
    const indicesLand: number[] = [];
    const colorsLand: number[] = [];

    // World placement offsets
    const worldWidth = getWorldWidth(this.world.sizeX);
    const worldDepth = getWorldDepth(this.world.sizeY);
    const offsetX = getWorldMinX(worldWidth);
    const offsetZ = getWorldMinZ(worldDepth);

    const colorOf = (t: Tile): Color3 => terrainColorMap[t.terrain.key] ?? Color3.Purple();

    // todo move to mapTools
    const isWater = (t: Tile): boolean => {
      const k = t.terrain.key;
      return (
        k === "terrainType:ocean" ||
        k === "terrainType:sea" ||
        k === "terrainType:coast" ||
        k === "terrainType:lake" ||
        k === "terrainType:majorRiver"
      );
    };

    const coastColor = terrainColorMap["terrainType:coast"];

    const vertex = (x: number, y: number, z: number, c: Color4) => {
      positionsLand.push(x, y, z);
      colorsLand.push(c.r, c.g, c.b, c.a);
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

        const hCenter = this.sampleH(heightMap, x, y);
        const cCenter3 = colorOf(tile);
        const cCenter = new Color4(cCenter3.r, cCenter3.g, cCenter3.b, 1);

        const dir = getHexNeighborDirections(y);
        const ring: { x: number; z: number; h: number; color: Color4 }[] = [];

        // Build six rim vertices (average height/color with neighbor)
        for (let i = 0; i < 6; i++) {
          // todo move to math
          const a = angleRad[i];
          const rx = cx + Math.cos(a) * s;
          const rz = cz + Math.sin(a) * s;

          // Neighbor mapping index order matching angles for pointy-top:
          // angles [30, 90, 150, 210, 270, 330] roughly correspond to [ne, nw, w, sw, se, e]
          const dirKey = ((): CompassHex => {
            switch (i) {
              case 0:
                return "ne";
              case 1:
                return "nw";
              case 2:
                return "w";
              case 3:
                return "sw";
              case 4:
                return "se";
              case 5:
              default:
                return "e";
            }
          })();

          // Neighbor coords with wrap on X and clamp on Y like mapTools
          let nx = x + dir[dirKey].x;
          let ny = y + dir[dirKey].y;
          if (ny < 0 || ny >= this.world.sizeY) {
            // No neighbor beyond poles -> use self for averaging
            nx = x;
            ny = y;
          } else {
            // todo move to math
            nx = ((nx % this.world.sizeX) + this.world.sizeX) % this.world.sizeX;
          }

          const hNeighbor = this.sampleH(heightMap, nx, ny);
          const tNeighbor = this.tilesByKey[Tile.getKey(nx, ny)] ?? tile;

          // Height and color at rim: blend with neighbor
          const hRim = 0.5 * (hCenter + hNeighbor);

          // Base color blend
          let cRim3 = cCenter3.clone();
          cRim3 = new Color3(
            0.5 * (cRim3.r + colorOf(tNeighbor).r),
            0.5 * (cRim3.g + colorOf(tNeighbor).g),
            0.5 * (cRim3.b + colorOf(tNeighbor).b),
          );

          // If mixing water/land, bias towards coast color to emulate beach/cliff edge
          const mixWater = isWater(tile) !== isWater(tNeighbor);
          if (mixWater) {
            cRim3 = new Color3(
              0.5 * (cRim3.r + coastColor.r),
              0.5 * (cRim3.g + coastColor.g),
              0.5 * (cRim3.b + coastColor.b),
            );
          }

          const cRim = new Color4(cRim3.r, cRim3.g, cRim3.b, 1);
          ring.push({ x: rx, z: rz, h: hRim, color: cRim });
        }

        // Skip generating per-tile water geometry; a single world water plane is used now
        if (isWater(tile)) continue;

        // Emit vertices: center + 6 rim into land buffers
        const baseIndex = positionsLand.length / 3;
        vertex(cx, hCenter, cz, cCenter);
        for (const rv of ring) vertex(rv.x, rv.h, rv.z, rv.color);

        // Triangulate fan (center, i, i+1)
        for (let i = 0; i < 6; i++) {
          const i0 = baseIndex; // center
          const i1 = baseIndex + 1 + i;
          const i2 = baseIndex + 1 + ((i + 1) % 6);
          indicesLand.push(i0, i1, i2);
        }
      }
    }

    // Build land mesh
    const land = new Mesh("terrain.land", this.scene);
    const vdLand = new VertexData();
    vdLand.positions = positionsLand;
    vdLand.indices = indicesLand;
    vdLand.colors = colorsLand;
    const normalsLand: number[] = [];
    VertexData.ComputeNormals(positionsLand, indicesLand, normalsLand);
    vdLand.normals = normalsLand;
    vdLand.applyToMesh(land, true);
    const matLand = new StandardMaterial("terrainMat.land", this.scene);
    matLand.specularColor = Color3.Black();
    land.material = matLand;
    land.parent = this.root;

    // Simple world-sized water plane to denote global sea level
    const waterPlane = MeshBuilder.CreateGround(
      "terrain.water.plane",
      { width: worldWidth, height: worldDepth, subdivisions: 1 },
      this.scene,
    );
    // Place below ground level (y=0)
    waterPlane.position.y = -0.2;
    const matWater = new StandardMaterial("terrainMat.water.plane", this.scene);
    matWater.diffuseColor = terrainColorMap["terrainType:sea"];
    matWater.specularColor = Color3.Black();
    waterPlane.material = matWater;
    waterPlane.parent = this.root;

    // Keep reference to land mesh as primary
    this.mesh = land;
    return this.root;
  }

  getMesh(): Mesh | null {
    return this.mesh;
  }

  dispose(): void {
    if (this.mesh) this.mesh.dispose(false, true);
    if (this.root) this.root.dispose(false, true);
    this.mesh = null;
    this.root = null;
  }

  private sampleH(hmap: Float32Array | null, x: number, y: number): number {
    if (!hmap) return this.blender.computeBlendedHeight(x, y);
    const idx = y * this.world.sizeX + x;
    return hmap[idx];
  }
}
