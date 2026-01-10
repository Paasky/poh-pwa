import { CompassHexCorner, CompassHexEdge } from "@/Common/Helpers/mapTools";
import { degToRad, pointInDir, xInDir, zInDir } from "@/Common/Helpers/math";
import { PointData } from "@/Actor/Human/Terrain/_terrainMeshTypes";

/**
 * Returns hex points for a given ring index.
 * Points are ordered counter-clockwise starting from the 0° (n) corner.
 * Ring radius is scaled by ringIndex / ringCount.
 */
export function pointsInRing(ringNumFromCenter: number, ringCount: number): PointData[] {
  if (ringNumFromCenter === 0) return [{ x: 0, z: 0, ringNumFromCenter }];

  const radius = ringNumFromCenter / ringCount;

  // edge: starting from the corner, walking counter-clockwise
  // NOTE! As we are dealing in x,z (not x,y), reality flips: north is 90deg, and counter-clockwise is to the right
  const corners = [
    { direction: 90, corner: "n", edge: "nw" },
    { direction: 150, corner: "nw", edge: "w" },
    { direction: 210, corner: "sw", edge: "sw" },
    { direction: 270, corner: "s", edge: "se" },
    { direction: 330, corner: "se", edge: "e" },
    { direction: 30, corner: "ne", edge: "ne" },
  ] as { direction: number; corner: CompassHexCorner; edge: CompassHexEdge }[];

  const points: PointData[] = [];

  for (const [i, cornerData] of corners.entries()) {
    // Convert angles to radians
    // A = current angle, B = next angle (counter-clockwise)
    const radA = degToRad(cornerData.direction);
    const radB = degToRad(corners[(i + 1) % 6].direction);

    // First point = corner
    points.push({
      ...pointInDir(radA, radius),
      ringNumFromCenter,
      corner: cornerData.corner,
    });

    // When past the 1st ring, insert 1 intermediate point per nth ring over 1, along the same edge
    // As we are building the points counter-clockwise, we will walk the edge counter-clockwise too
    // (e.g., 2nd ring: edge = 2 corners + 1 mid-point, 3rd ring: 2 corners + 2 mid-points, etc.)
    for (let step = 1; step < ringNumFromCenter; step++) {
      const fractionAlongEdge = step / ringNumFromCenter;
      points.push({
        x:
          (1 - fractionAlongEdge) * xInDir(radA, radius) + fractionAlongEdge * xInDir(radB, radius),
        z:
          (1 - fractionAlongEdge) * zInDir(radA, radius) + fractionAlongEdge * zInDir(radB, radius),
        ringNumFromCenter,
        edge: cornerData.edge,
      });
    }
  }

  return points;
}
