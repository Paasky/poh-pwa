import { CompassHexCorner, CompassHexEdge } from "@/helpers/mapTools";
import { Color4 } from "@babylonjs/core";
import {
  EngineCoords,
  PointData,
  TerrainTileBuffers,
} from "@/Player/Human/Terrain/_terrainMeshTypes";

export const buildHexGpuBuffer = (
  // this is the center of the hex tile in the world
  center: EngineCoords,
  // precomputed rings of vertices inside the hex
  // note: the x,z coords must be relative to the hex center, not world coords!
  points: PointData[],
  // precomputed triangles of vertices inside the hex
  triangles: number[],
  // Used to set the color of a vertex, e.g., getColor(2, "n", undefined) for "top corner in 2nd ring"
  getColor: (ringNumFromCenter: number, corner?: CompassHexCorner, edge?: CompassHexEdge) => Color4,
  // Used to set the height of a vertex, e.g., getY(3, undefined, "w") for "a left edge vertex in 3rd ring"
  getHeight: (
    ringNumFromCenter: number,
    corner?: CompassHexCorner,
    edge?: CompassHexEdge,
  ) => number,
  // Values will be pushed into this buffer
  gpuBuffer: TerrainTileBuffers,
) => {
  // If there are no points, there is nothing to append — and any incoming
  // triangle indices would be invalid (would reference non-existent vertices).
  // Early-exit to keep buffers unchanged in that case.
  if (!points.length) return;

  const colors = points.map((p) => getColor(p.ringNumFromCenter, p.corner, p.edge));

  const positions = points.map((p) => ({
    x: center.x + p.x,
    y: getHeight(p.ringNumFromCenter, p.corner, p.edge),
    z: center.z + -p.z, // Z is inverted to match Babylon's coordinate system (N = -Z, S = +Z)
  }));

  const positionBase = gpuBuffer.positions.length / 3;
  gpuBuffer.colors.push(
    ...colors.flatMap((c) => [
      // Add slight color noise
      c.r * (1 + (Math.random() - 0.5) / 15),
      c.g * (1 + (Math.random() - 0.5) / 15),
      c.b * (1 + (Math.random() - 0.5) / 15),
      c.a,
    ]),
  );
  gpuBuffer.positions.push(
    // Add very slight height noise to make large flat plains get some variation
    ...positions.flatMap((p) => [p.x, p.y + (Math.random() - 0.5) / 50, p.z]),
  );
  gpuBuffer.indices.push(...triangles.map((i) => positionBase + i));
};
