import type { WorldState } from "@/types/common";
import { Tile } from "@/objects/game/Tile";
import { getHexCornerPosition, tileCenter } from "@/components/Engine/math";
import { CompassHexCorner, Coords, getHexCornerNeighbors, tileHeight } from "@/helpers/mapTools";
import { Color4 } from "@babylonjs/core";
import { colorOf, terrainColorMap } from "@/assets/materials/terrains";

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
  // todo: Future geometry/policy controls (currently unused until K-rings are implemented)
  detail?: TerrainDetailOptions,
): TerrainTileBuffers {
  // Corner order matching angleRad: 30°, 90°, 150°, 210°, 270°, 330°
  // Note: +Z grows south in our world space, so the N/S labels must be flipped
  // relative to mathematical angles. The correct edge order for our angles is:
  //   30°→se, 90°→s, 150°→sw, 210°→nw, 270°→n, 330°→ne
  const corners = {
    se: cornerAngleAndRad(30),
    s: cornerAngleAndRad(90),
    sw: cornerAngleAndRad(150),
    nw: cornerAngleAndRad(210),
    n: cornerAngleAndRad(270),
    ne: cornerAngleAndRad(330),
  } as Record<CompassHexCorner, { angle: number; rad: number }>;

  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  const vertex = (x: number, y: number, z: number, c: Color4) => {
    positions.push(x, y, z);
    colors.push(c.r, c.g, c.b, c.a);
  };

  const grassColor = terrainColorMap["terrainType:grass"];
  const rocksColor = terrainColorMap["terrainType:rocks"];
  const sandColor = terrainColorMap["terrainType:desert"];
  const snowColor = terrainColorMap["terrainType:snow"];

  // Iterate tiles row-major
  const size = { x: world.sizeX, y: world.sizeY } as Coords;
  for (let y = 0; y < world.sizeY; y++) {
    for (let x = 0; x < world.sizeX; x++) {
      const tile = tilesByKey[Tile.getKey(x, y)];
      // Critical error: means we got invalid data input
      if (!tile) throw new Error(`Tile ${x},${y} not found in tilesByKey`);

      // Center point of this tile (immutable)
      const center = {
        ...tileCenter(size, tile),
        height: tileHeight(tile),
        color: colorOf(tile, true),
      };
      // todo: would it make more sense to add center vertex and index here?

      const ring: { x: number; z: number; h: number; color: Color4 }[] = [];
      for (const [corner, cornerData] of Object.entries(corners) as [
        CompassHexCorner,
        { angle: number; rad: number },
      ][]) {
        const cornerPos = getHexCornerPosition(center.x, center.z, cornerData.rad);

        // Get the 0-2 neighbors for this corner
        const neighbors = getHexCornerNeighbors(size, tile, tilesByKey, corner);

        // if a neighbor doesn't exist (OOB), use flat snow (N/S pole)
        const neighborHeights = [
          neighbors[0] ? tileHeight(neighbors[0]) : 0,
          neighbors[1] ? tileHeight(neighbors[1]) : 0,
        ];
        const neighborColors = [
          neighbors[0] ? colorOf(neighbors[0]) : snowColor,
          neighbors[1] ? colorOf(neighbors[1]) : snowColor,
        ];

        ring.push({
          x: cornerPos.x,
          z: cornerPos.z,
          h: (center.height + neighborHeights[0] + neighborHeights[1]) / 3,
          color: new Color4(
            (center.color.r + neighborColors[0].r + neighborColors[1].r) / 3,
            (center.color.g + neighborColors[0].g + neighborColors[1].g) / 3,
            (center.color.b + neighborColors[0].b + neighborColors[1].b) / 3,
            1,
          ),
        });

        // todo: would it make more sense to add point vertex and index here?
      }

      // Emit vertices: center + 6 rim into the single buffer
      const baseIndex = positions.length / 3;
      vertex(center.x, center.height, center.z, center.color);
      for (const point of ring) vertex(point.x, point.h, point.z, point.color);

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

const cornerAngleAndRad = (angle: number) => ({ angle, rad: (angle * Math.PI) / 180 });
