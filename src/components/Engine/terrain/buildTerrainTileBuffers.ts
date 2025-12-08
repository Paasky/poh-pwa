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
import { Color3, Color4 } from "@babylonjs/core";
import { terrainColorMap } from "@/assets/materials/terrains";
import { ElevationBlender } from "@/components/Engine/terrain/ElevationBlender";

// Public detail options for terrain tessellation and height/color policies
export type TerrainDetailOptions = {
  // Number of concentric hex rings from center to rim (K). K=1 equals current 7-point hex.
  rings?: number; // default 3
  // Height policy along shared edges (outer rim and interior ring edges)
  // twoTileLinear: sample is a function of only the two tiles sharing the edge
  edgeMode?: "twoTileLinear";
  // Corner policy (vertices influenced by three tiles)
  cornerMode?: "threeTileAverage" | "twoTileDominant";
  // Optional rule to reduce end bumps on straight banks (e.g., long straight rivers)
  flattenStraightEdges?: boolean;
  // Future: treat very steep differences as creases (no smoothing across)
  cliffThreshold?: number;
};

export type TerrainTileBuffers = {
  positions: number[];
  colors: number[];
  indices: number[];
};

// Builds the raw vertex/color/index buffers for all terrain tiles (pre-welding)
// TODO (detail/tessellation):
// - Replace single-ring emission with K-ring tessellation (K = detail?.rings ?? 3)
//   Geometry plan per hex:
//     - Generate K rings; each side has K segments → K+1 vertices per side per ring.
//     - Positions are built by subdividing between the 6 corner directions (angles below).
//     - Triangulation: connect ring r-1 to r with 6 triangle strips → Ntris = 6*K*K.
// - Height policy:
//     - Edge vertices should depend only on the two tiles that share the edge (edgeMode "twoTileLinear").
//     - Corner vertices use three-tile policy (cornerMode), default to average of the three.
//     - Optional flattenStraightEdges: detect straight banks and clamp corner heights near ends to the edge profile.
// - Color policy:
//     - Match height policy: two-tile blend for edge samples; three-tile average for corners.
// - Neighbor helpers:
//     - Prefer using getHexNeighborDirections(y) from mapTools for across-edge neighbors.
//     - If we need specialized helpers (e.g., getAcrossNeighbor), consider adding to mapTools.ts.
//
// For now, we keep legacy behavior (K=1 fan) to avoid breaking visuals while the API lands.
 
export function buildTerrainTileBuffers(
  world: WorldState,
  tilesByKey: Record<string, Tile>,
  blender: ElevationBlender,
  // Future geometry/policy controls (currently unused until K-rings are implemented)
  detail?: TerrainDetailOptions,
): TerrainTileBuffers {
  const angleDeg: number[] = [30, 90, 150, 210, 270, 330]; // pointy-top hex rim angles
  const angleRad = angleDeg.map((a) => (a * Math.PI) / 180);

  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  // World placement offsets
  const worldWidth = getWorldWidth(world.sizeX);
  const worldDepth = getWorldDepth(world.sizeY);
  const offsetX = getWorldMinX(worldWidth);
  const offsetZ = getWorldMinZ(worldDepth);

  const colorOf = (t: Tile): Color3 => terrainColorMap[t.terrain.key] ?? Color3.Purple();
  const snowColor = terrainColorMap["terrainType:snow"];

  const vertex = (x: number, y: number, z: number, c: Color4) => {
    positions.push(x, y, z);
    colors.push(c.r, c.g, c.b, c.a);
  };

  // Iterate tiles row-major
  for (let y = 0; y < world.sizeY; y++) {
    for (let x = 0; x < world.sizeX; x++) {
      const tile = tilesByKey[Tile.getKey(x, y)];
      if (!tile) continue;

      // Center position of this tile (odd-r layout)
      const cx = offsetX + hexWidth * (x + 0.5 * (y & 1));
      const cz = offsetZ + hexDepth * y;

      const hCenter = blender.sampleBaseHeight(x, y);
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
        const rx = cx + Math.cos(a);
        const rz = cz + Math.sin(a);

        // Get the two neighbor deltas for this corner
        const [dA, dB] = getHexEdgeNeighborDirections(y, edges[i]);

        // Resolve neighbor coords with wrap on X, clamp on Y.
        // If neighbor would cross a pole, treat it as a synthetic FLAT+SNOW tile.
        type NInfo = { x: number; y: number; exists: boolean };
        const resolve = (dx: number, dy: number): NInfo => {
          const ny = y + dy;
          if (ny < 0 || ny >= world.sizeY) return { x, y, exists: false };
          let nx = x + dx;
          nx = ((nx % world.sizeX) + world.sizeX) % world.sizeX;
          return { x: nx, y: ny, exists: true };
        };

        const nA = resolve(dA.x, dA.y);
        const nB = resolve(dB.x, dB.y);

        const hA = nA.exists ? blender.sampleBaseHeight(nA.x, nA.y) : 0;
        const hB = nB.exists ? blender.sampleBaseHeight(nB.x, nB.y) : 0;
        const hRim = (hCenter + hA + hB) / 3;

        const tA = nA.exists ? tilesByKey[Tile.getKey(nA.x, nA.y)] : null;
        const tB = nB.exists ? tilesByKey[Tile.getKey(nB.x, nB.y)] : null;
        const cA = tA ? colorOf(tA) : snowColor;
        const cB = tB ? colorOf(tB) : snowColor;
        const cRim3 = new Color3(
          (cCenter3.r + cA.r + cB.r) / 3,
          (cCenter3.g + cA.g + cB.g) / 3,
          (cCenter3.b + cA.b + cB.b) / 3,
        );

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

  return { positions, colors, indices };
}
