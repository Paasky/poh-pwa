/*
Tile grid mesh (prototype)

Purpose
- Render a visible hex map built from the loaded Tile[] using flat terrain colors.
- Use Babylon instanced meshes with a master per terrain color (simple, scalable enough for MVP).

Data source
- Engine is initialized after all game data is loaded (see appStore). We directly read
  tiles from the object store via `objStore.getClassGameObjects('tile') as Tile[]`.
- No defensive checks necessary — all required objects exist by this point.

Notes / future work
- Switch to thin instances with per-instance color buffer for large worlds.
- Material system: replace flat colors with TerrainMaterial when ready.
- Heights: when elevation is introduced, raise/offset Y per tile.
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
import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

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

  // --- Terrain color palette (from LevelSection.vue) ---
  // Keys use full type keys to avoid ambiguity.
  type TerrainPaintKey =
    | "terrainType:snow"
    | "terrainType:tundra"
    | "terrainType:grass"
    | "terrainType:plains"
    | "terrainType:desert"
    | "terrainType:lake"
    | "terrainType:majorRiver"
    | "terrainType:coast"
    | "terrainType:sea"
    | "terrainType:ocean";

  const terrainHex: Record<TerrainPaintKey, string> = {
    "terrainType:ocean": "#172554",
    "terrainType:sea": "#1e3a8a",
    "terrainType:coast": "#1e5f8aff", // includes alpha in CSS; we respect it here
    "terrainType:lake": "#164e63",
    "terrainType:majorRiver": "#1e3a8a", // same as river in LevelSection
    "terrainType:grass": "#3f6212",
    "terrainType:plains": "#575310",
    "terrainType:desert": "#b8b83b",
    "terrainType:tundra": "#3e5234",
    "terrainType:snow": "#a0a1a8ff", // includes alpha in CSS; we respect it here
  };

  const hexToColor = (hex: string): { color: Color3; alpha: number } => {
    const clean = hex.trim().replace(/^#/, "");
    if (clean.length === 8) {
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      const a = parseInt(clean.slice(6, 8), 16) / 255;
      return { color: new Color3(r, g, b), alpha: a };
    }
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return { color: new Color3(r, g, b), alpha: 1 };
  };

  // Base hex geometry (pointy-top)
  const baseGeom = MeshBuilder.CreateCylinder(
    "hexBaseGeom",
    { height: h, diameter: 2 * s, tessellation: 6 },
    scene,
  );
  // Rotate 30° around Y so the hex becomes POINTY-TOP to match our odd-r layout.
  baseGeom.rotation.y = Math.PI / 6;
  baseGeom.isVisible = false; // masters are hidden; instances render

  // Create a hidden master per terrain paint key, all sharing cloned geometry
  const masters: Record<TerrainPaintKey, Mesh> = {
    "terrainType:ocean": baseGeom.clone("hexMaster-ocean", null) as Mesh,
    "terrainType:sea": baseGeom.clone("hexMaster-sea", null) as Mesh,
    "terrainType:coast": baseGeom.clone("hexMaster-coast", null) as Mesh,
    "terrainType:lake": baseGeom.clone("hexMaster-lake", null) as Mesh,
    "terrainType:majorRiver": baseGeom.clone("hexMaster-majorRiver", null) as Mesh,
    "terrainType:grass": baseGeom.clone("hexMaster-grass", null) as Mesh,
    "terrainType:plains": baseGeom.clone("hexMaster-plains", null) as Mesh,
    "terrainType:desert": baseGeom.clone("hexMaster-desert", null) as Mesh,
    "terrainType:tundra": baseGeom.clone("hexMaster-tundra", null) as Mesh,
    "terrainType:snow": baseGeom.clone("hexMaster-snow", null) as Mesh,
  };

  for (const [k, mesh] of Object.entries(masters) as [TerrainPaintKey, Mesh][]) {
    const { color, alpha } = hexToColor(terrainHex[k]);
    const mat = new StandardMaterial(`mat-${k}`, scene);
    mat.diffuseColor = color;
    mat.specularColor = Color3.Black();
    mat.alpha = alpha;
    mesh.material = mat;
    mesh.isVisible = false;
    mesh.parent = root;
  }

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

  const toPaintKey = (t: Tile): TerrainPaintKey => {
    // Rivers are overlays in game data; for MVP paint major rivers in river color
    if (t.isMajorRiver) return "terrainType:majorRiver";
    const key = t.terrain.key as string;
    switch (key) {
      case "terrainType:snow":
      case "terrainType:tundra":
      case "terrainType:grass":
      case "terrainType:plains":
      case "terrainType:desert":
      case "terrainType:lake":
      case "terrainType:coast":
      case "terrainType:sea":
      case "terrainType:ocean":
        return key;
      default:
        // Fallback to grass for unknown/missing terrains
        return "terrainType:grass";
    }
  };

  for (const t of tiles) {
    const paintKey = toPaintKey(t);
    const master = masters[paintKey];

    // Odd-r row offset on X for pointy-top
    const baseWx = offsetX + dx * (t.x + 0.5 * (t.y & 1));
    const wz = offsetZ + dz * t.y;

    // --- Elevation & water level ---
    // Minimal vertical placement: water below ground, hills/mountains above.
    type ElevationKey =
      | "elevationType:flat"
      | "elevationType:hill"
      | "elevationType:mountain"
      | "elevationType:snowMountain";
    type WaterTerrainKey = "terrainType:ocean" | "terrainType:sea" | "terrainType:coast" | "terrainType:lake";

    const isWaterTerrain = (t.terrain.key as string) === "terrainType:ocean"
      || (t.terrain.key as string) === "terrainType:sea"
      || (t.terrain.key as string) === "terrainType:coast"
      || (t.terrain.key as string) === "terrainType:lake";

    const elevationKey = t.elevation.key as ElevationKey | string;

    // Choose offsets based on hex radius for visibility (independent of mesh thickness)
    const hUnit = Math.max(h, 0.2 * s); // visual unit for vertical displacement
    let yOffset = 0;
    let yScale = 1;
    if (isWaterTerrain) {
      // Water sits below ground plane; deeper for ocean/sea than coast/lake
      const tk = t.terrain.key as WaterTerrainKey | string;
      switch (tk) {
        case "terrainType:ocean":
          yOffset = -2.0 * hUnit;
          yScale = 0.8;
          break;
        case "terrainType:sea":
          yOffset = -1.6 * hUnit;
          yScale = 0.85;
          break;
        case "terrainType:lake":
          yOffset = -1.2 * hUnit;
          yScale = 0.9;
          break;
        case "terrainType:coast":
          yOffset = -0.8 * hUnit;
          yScale = 0.95;
          break;
        default:
          yOffset = -1.2 * hUnit;
          yScale = 0.9;
      }
    } else {
      switch (elevationKey) {
        case "elevationType:hill":
          yOffset = 0.8 * hUnit; // rolling hills
          yScale = 1.4;
          break;
        case "elevationType:mountain":
          yOffset = 1.8 * hUnit; // mountains
          yScale = 2.2;
          break;
        case "elevationType:snowMountain":
          yOffset = 2.4 * hUnit; // snowy peaks
          yScale = 2.8;
          break;
        case "elevationType:flat":
        default:
          yOffset = 0; // ground level
          yScale = 1;
      }
    }

    for (const rIdx of repIndices) {
      const wx = baseWx + rIdx * periodX;
      const inst = master.createInstance(`${paintKey}-${t.x}-${t.y}-r${rIdx}`);
      inst.parent = root;
      inst.position = new Vector3(wx, yOffset, wz);
      if (yScale !== 1) {
        inst.scaling = new Vector3(1, yScale, 1);
      }
    }
  }

  // Keep base geometry under root too (even though hidden) for lifecycle management
  baseGeom.parent = root;

  return { root, periodX };
}
