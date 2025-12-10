import { CompassHexCorner, CompassHexEdge } from '@/helpers/mapTools'
import { degToRad } from '@/helpers/math'
import { PointData } from '@/factories/TerrainMeshBuilder/_terrainMeshTypes'

/**
 * Returns hex points for a given ring index.
 * Points are ordered counter-clockwise starting from the 0° (n) corner.
 * Ring radius is scaled by ringIndex / totalRings.
 */
export function pointsInRing (ringNumFromCenter: number, totalRings: number): PointData[] {
  if (ringNumFromCenter === 0) return [{ x: 0, z: 0, ringNumFromCenter }]

  const radius = ringNumFromCenter / totalRings

  // edge: starting from the corner, walking counter-clockwise
  const corners = [
    { direction: 0, corner: 'n', edge: 'nw' },
    { direction: 300, corner: 'nw', edge: 'sw' },
    { direction: 240, corner: 'sw', edge: 's' },
    { direction: 180, corner: 's', edge: 'se' },
    { direction: 120, corner: 'se', edge: 'ne' },
    { direction: 60, corner: 'ne', edge: 'n' },
  ] as { direction: number; corner: CompassHexCorner; edge: CompassHexEdge }[]

  const points: PointData[] = []

  for (const [i, cornerData] of corners.entries()) {
    // Convert angles to radians
    // A = current angle, B = next angle (counter-clockwise)
    const radA = degToRad(cornerData.direction)
    const radB = degToRad(corners[(i + 1) % 6].direction)

    // First point = corner
    points.push({
      x: Math.cos(radA) * radius,
      z: Math.sin(radA) * radius,
      ringNumFromCenter,
      corner: cornerData.corner,
    })

    // When past the 1st ring, insert 1 intermediate point per nth ring over 1, along the same edge
    // As we are building the points counter-clockwise, we will walk the edge counter-clockwise too
    // (e.g., 2nd ring: edge = 2 corners + 1 mid-point, 3rd ring: 2 corners + 2 mid-points, etc.)
    for (let step = 1; step < ringNumFromCenter; step++) {
      const fractionAlongEdge = step / ringNumFromCenter
      points.push({
        x:
          (1 - fractionAlongEdge) * Math.cos(radA) * radius +
          fractionAlongEdge * Math.cos(radB) * radius,
        z:
          (1 - fractionAlongEdge) * Math.sin(radA) * radius +
          fractionAlongEdge * Math.sin(radB) * radius,
        ringNumFromCenter,
        edge: cornerData.edge,
      })
    }
  }

  return points
}