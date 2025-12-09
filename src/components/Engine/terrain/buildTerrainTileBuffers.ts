import type { WorldState } from "@/types/common";
import { Tile } from "@/objects/game/Tile";
import { avg, tileCenter } from "@/components/Engine/math";
import {
  Coords,
  getHexCornerNeighbors,
  getHexNeighbor,
  pointsInRing,
  tileHeight,
} from "@/helpers/mapTools";
import { Color4 } from "@babylonjs/core";
import { colorOf, terrainColorMap } from "@/assets/materials/terrains";

// Public detail options for terrain tessellation and height/color policies
export type TerrainDetailOptions = {
  // Number of concentric hex rings from center to edge (K). K=1 equals the current 7-vertex hex (center + 6 corners).
  rings?: number; // default 3
  // Height policy along shared edges (outer corners and interior ring edges)
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
export function buildTerrainTileBuffers(
  world: WorldState,
  tilesByKey: Record<string, Tile>,
  detail?: TerrainDetailOptions,
): TerrainTileBuffers {
  const ringCount = 2; // replace with detail?.rings ?? 3 when ready

  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  const snowColor = terrainColorMap["terrainType:snow"];

  const size = { x: world.sizeX, y: world.sizeY } as Coords;

  const pushVertex = (x: number, y: number, z: number, color: Color4) => {
    positions.push(x, y, z);
    colors.push(color.r, color.g, color.b, color.a);
    return positions.length / 3 - 1; // return vertex index
  };

  for (let tileY = 0; tileY < world.sizeY; tileY++) {
    for (let tileX = 0; tileX < world.sizeX; tileX++) {
      const tile = tilesByKey[Tile.getKey(tileX, tileY)];
      if (!tile) throw new Error(`Tile ${tileX},${tileY} not found in tilesByKey`);

      const center = {
        ...tileCenter(size, tile),
        height: tileHeight(tile),
        color: colorOf(tile, true),
      };

      // emit center vertex and start prevRingIndices with that index (center fan)
      const centerIndex = pushVertex(center.x, center.height, center.z, center.color);
      let prevRingIndices: number[] = [centerIndex];

      // build rings outward
      for (let ringIndex = 1; ringIndex <= ringCount; ringIndex++) {
        const points = pointsInRing(ringIndex, ringCount);
        const currRingIndices: number[] = [];

        // emit all vertices for this ring, record their indices
        for (const point of points) {
          // compute blended height/color
          const affectingHeights = [center.height] as number[];
          const affectingColors = [center.color] as Color4[];

          if (point.corner) {
            const cornerNeighbors = getHexCornerNeighbors(size, tile, tilesByKey, point.corner);
            affectingHeights.push(
              cornerNeighbors[0] ? tileHeight(cornerNeighbors[0]) : 0,
              cornerNeighbors[1] ? tileHeight(cornerNeighbors[1]) : 0,
            );
            affectingColors.push(
              cornerNeighbors[0] ? colorOf(cornerNeighbors[0]) : snowColor,
              cornerNeighbors[1] ? colorOf(cornerNeighbors[1]) : snowColor,
            );
          } else if (point.edge) {
            const edgeNeighbor = getHexNeighbor(size, tile, tilesByKey, point.edge);
            affectingHeights.push(edgeNeighbor ? tileHeight(edgeNeighbor) : 0);
            affectingColors.push(edgeNeighbor ? colorOf(edgeNeighbor) : snowColor);
          }

          const vertexHeight = avg(affectingHeights);
          const vertexColor = new Color4(
            avg(affectingColors.map((c) => c.r)),
            avg(affectingColors.map((c) => c.g)),
            avg(affectingColors.map((c) => c.b)),
            1,
          );

          const worldX = center.x + point.x;
          const worldZ = center.z + point.z;
          pushVertex(worldX, vertexHeight, worldZ, vertexColor);
          currRingIndices.push(positions.length / 3 - 1);

          // add triangles counter-clockwise (CCW) as indices.push(point1idx, point1idx, point1idx)
        }

        if (prevRingIndices.length) {
          stitchHexRings(prevRingIndices, currRingIndices, indices);
        }

        // freeze current ring into prev for next iteration (clone, do NOT alias)
        prevRingIndices = [...currRingIndices];
      }
    }
  }

  return { positions, colors, indices };
}

/**
 * Stitch two concentric hex rings into triangle indices.
 * - prevRingIndices: indices of ring R-1 (can be length 1 for center)
 * - currRingIndices: indices of ring R (must be length 6 * R)
 *
 * This routine:
 * - handles the center fan (prev length === 1)
 * - otherwise stitches side-by-side assuming each ring is divisible into 6 equal sides
 */
function stitchHexRings(prevRingIndices: number[], currRingIndices: number[], indices: number[]) {
  const prevCount = prevRingIndices.length;
  const currCount = currRingIndices.length;

  // center → first ring
  if (prevCount === 1) {
    const center = prevRingIndices[0];
    for (let i = 0; i < currCount; i++) {
      const a = center;
      const b = currRingIndices[i];
      const c = currRingIndices[(i + 1) % currCount];
      indices.push(a, b, c); // CCW
    }
    return;
  }

  // known ratio only: curr = 2 * prev (valid for ring 1→2 only)
  if (currCount !== prevCount * 2) {
    console.error("Unexpected ring sizes", prevCount, currCount);
    return;
  }

  for (let i = 0; i < prevCount; i++) {
    const p0 = prevRingIndices[i];
    const p1 = prevRingIndices[(i + 1) % prevCount];

    const c0 = currRingIndices[i * 2];
    const c1 = currRingIndices[i * 2 + 1];
    const c2 = currRingIndices[(i * 2 + 2) % currCount];

    // 2 triangles: always CCW matching center fan
    indices.push(p0, c0, c1); // CCW
    indices.push(p0, c1, c2); // CCW
  }
}
