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
import { getWorldDepth, getWorldWidth } from "@/components/Engine/math";
import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode } from "@babylonjs/core";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { asColor3, terrainColorMap } from "@/assets/materials/terrains";
import { ElevationBlender } from "@/components/Engine/terrain/ElevationBlender";
import type { TerrainDetailOptions } from "@/components/Engine/terrain/buildTerrainTileBuffers";
import { buildTerrainTileBuffers } from "@/components/Engine/terrain/buildTerrainTileBuffers";
import { weldMeshByXZ } from "@/components/Engine/terrain/weldMeshByXZ";

export type TerrainBuildOptions = {
  smoothing?: number; // 0..1 (passed to ElevationBlender)
  jitter?: number; // noise amplitude for heights
  detail?: TerrainDetailOptions; // geometry/detail policy (K-rings, edge/corner modes, etc.)
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
    const defaultDetail: TerrainDetailOptions = {
      rings: 1, // todo up to 2 once verified it works with 1
      edgeMode: "twoTileLinear",
      cornerMode: "threeTileAverage",
      flattenStraightEdges: false,
    };
    this.opts = {
      smoothing: options?.smoothing ?? 0.6,
      jitter: options?.jitter ?? 0.04,
      detail: { ...defaultDetail, ...(options?.detail ?? {}) },
    } as Required<TerrainBuildOptions>;

    // todo new objStore getter: tilesByKey
    // Pinia getters are cached/computed — expose a tilesByKey getter on the store
    // to avoid rebuilding this map here every time. Find other usages of objStore.getClassGameObjects("tile") and refactor those too
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

    // Build raw buffers and weld them using extracted utilities
    // buildTerrainTileBuffers:
    //   - Iterates all hex tiles and emits pre-weld vertex positions, per-vertex colors,
    //     and triangle indices for the top faces only. Pure data step (no Babylon types).
    const { positions, colors, indices } = buildTerrainTileBuffers(
      this.world,
      this.tilesByKey,
      this.opts.detail,
    );

    // weldMeshByXZ:
    //   - Quantizes X/Z to merge duplicate seam vertices across tiles, averaging
    //     positions and colors, and dropping degenerate triangles. Still pure data.
    const welded = weldMeshByXZ(positions, colors, indices, 1e-4);

    // Build a single mesh for all tiles from welded buffers
    //   - Compute normals once on the welded geometry for smooth shading
    //   - Apply a matte material (tiles shouldn't have specular highlights)
    const tiles = new Mesh("terrain.tiles", this.scene);
    const vd = new VertexData();
    vd.positions = welded.positions;
    vd.indices = welded.indices;
    vd.colors = welded.colors;
    const normals: number[] = [];
    if (welded.positions.length && welded.indices.length)
      VertexData.ComputeNormals(welded.positions, welded.indices, normals);
    vd.normals = normals;
    vd.applyToMesh(tiles, true);
    const matTiles = new StandardMaterial("terrainMat.tiles", this.scene);
    // Keep tiles matte; specular comes from water plane only
    matTiles.specularColor = Color3.Black();
    tiles.material = matTiles;
    tiles.parent = this.root;

    // Simple world-sized water plane to denote global sea level
    const worldWidth = getWorldWidth(this.world.sizeX);
    const worldDepth = getWorldDepth(this.world.sizeY);
    const waterPlane = MeshBuilder.CreateGround(
      "terrain.water.plane",
      { width: worldWidth, height: worldDepth, subdivisions: 1 },
      this.scene,
    );
    // Place below ground level (y=0)
    waterPlane.position.y = -10.2;
    const matWater = new StandardMaterial("terrainMat.water.plane", this.scene);
    matWater.diffuseColor = asColor3(terrainColorMap["terrainType:ocean"]);
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
