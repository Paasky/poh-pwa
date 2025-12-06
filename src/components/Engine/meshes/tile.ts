/*
Tile grid mesh (prototype)

Purpose
- Replace the placeholder checkerboard with a visible hex map built from the loaded Tile[].
- Super-simple visuals: blue for water, green for land, using Babylon instanced meshes.

Data source
- Engine is initialized after all game data is loaded (see appStore). We directly read
  tiles from the object store via `objStore.getClassGameObjects('tile') as Tile[]`.
- No defensive checks necessary — all required objects exist by this point.

Notes / future work
- Switch to a single SPS or thin instances for better scalability (this prototype uses
  InstancedMesh for simplicity and clarity).
- Material system: replace flat colors with TerrainMaterial when ready; add vertex colors
  or texture lookups by terrain/biome.
- Heights: when elevation is introduced, raise/offset Y per tile, optionally blended via
  ElevationBlender.
- Fog of war: modulate material by FogOfWar alpha mask.
- Partial updates: expose update(changedTiles?: GameKey[]) to move towards incremental sync.

Hex orientation & layout
- Project standard: POINTY-TOP hexes with odd-r (row-offset) layout (typical in 4X games).
- Spacing for pointy-top (r = distance center→vertex):
  - dx = sqrt(3) * r (column step)
  - dz = 1.5 * r      (row step)
- Row offset on X: x += 0.5 * dx for odd rows (y & 1)
*/

import { useObjectsStore } from "@/stores/objectStore";
import { Tile } from "@/objects/game/Tile";
import type { WorldState } from "@/types/common";
import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

export type TileGridOptions = {
  hexRadius?: number; // world units, distance from center to vertex
  tileHeight?: number; // mesh height (thickness)
  replicateX?: number; // how many horizontal repetitions for wrap illusion (odd number recommended, default 1)
};

export type TileGridBuild = {
  root: TransformNode;
  // Horizontal repeat period in world units (distance after which the map repeats on X)
  periodX: number;
};

export function buildTileGrid(scene: Scene, world: WorldState, opts: TileGridOptions = {}): TileGridBuild {
  const s = opts.hexRadius ?? 1;
  const h = opts.tileHeight ?? 0.05;
  const replicateX = Math.max(1, Math.floor(opts.replicateX ?? 1));

  const objStore = useObjectsStore();
  const tiles = objStore.getClassGameObjects("tile") as Tile[];

  // Root to hold instances (lets us center the grid around world origin)
  const root = new TransformNode("tileGridRoot", scene);

  // Base hex geometry
  const baseLand = MeshBuilder.CreateCylinder(
    "hexLandBase",
    { height: h, diameter: 2 * s, tessellation: 6 },
    scene,
  );
  // Babylon's 6-sided cylinder defaults to flat-top orientation in XZ.
  // Rotate 30° around Y so the hex becomes POINTY-TOP to match our odd-r layout.
  baseLand.rotation.y = Math.PI / 6;
  baseLand.isVisible = false; // master hidden; instances render

  const baseWater = baseLand.clone("hexWaterBase", null)!;
  baseWater.rotation.y = baseLand.rotation.y;
  baseWater.isVisible = false;

  // Simple flat-color materials
  const landMat = new StandardMaterial("landMat", scene);
  landMat.diffuseColor = new Color3(0.12, 0.5, 0.2); // greenish
  landMat.specularColor = Color3.Black();
  baseLand.material = landMat;

  const waterMat = new StandardMaterial("waterMat", scene);
  waterMat.diffuseColor = new Color3(0.1, 0.3, 0.8); // blueish
  waterMat.specularColor = Color3.Black();
  baseWater.material = waterMat;

  // Layout math: pointy-top hexes, odd-r (rows staggered)
  const dx = Math.sqrt(3) * s; // horizontal spacing between centers
  const dz = 1.5 * s; // vertical spacing per row

  // Horizontal repeat period (distance between equivalent tiles across the wrap seam)
  const periodX = dx * world.sizeX;

  // Compute offsets to roughly center the grid around world origin
  const hasOddRows = world.sizeY > 1;
  const maxX = dx * (world.sizeX - 1) + (hasOddRows ? 0.5 * dx : 0);
  const maxZ = dz * (world.sizeY - 1);
  const offsetX = -maxX / 2;
  const offsetZ = -maxZ / 2;

  // Determine horizontal replication indices (symmetrical around the center when odd)
  const halfRep = Math.floor((replicateX - 1) / 2);
  const repIndices: number[] = [];
  for (let k = -halfRep; k <= halfRep; k++) repIndices.push(k);
  // If replicateX is even, we still place copies to the right (non-symmetric), fine for prototyping
  if (replicateX % 2 === 0) {
    for (let k = halfRep + 1; k < replicateX; k++) repIndices.push(k);
  }

  for (const t of tiles) {
    // Choose master based on domain
    const isWater = t.domain.key === "domainType:water";
    const master = isWater ? baseWater : baseLand;

    // Odd-r row offset on X for pointy-top
    const baseWx = offsetX + dx * (t.x + 0.5 * (t.y & 1));
    const wz = offsetZ + dz * t.y;

    for (const rIdx of repIndices) {
      const wx = baseWx + rIdx * periodX;
      const inst = master.createInstance(`${isWater ? "w" : "l"}-${t.x}-${t.y}-r${rIdx}`);
      inst.parent = root;
      inst.position = new Vector3(wx, 0, wz);
    }
  }

  // Keep masters out of the way (hidden already), parent them for lifecycle management
  baseLand.parent = root;
  baseWater.parent = root;

  return { root, periodX };
}
