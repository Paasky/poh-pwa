import { PointData } from '@/factories/TerrainMeshBuilder/_terrainMeshTypes'

/**
 * Generate triangles for any kN hex tile
 * @param points - array returned by pointsInRing(0..N)
 * @param ringCount - N (number of rings)
 */
export function hexTrianglesFromPoints (points: PointData[], ringCount: number): number[] {
  const triangles: number[] = []

  // No rings beyond the center → nothing to triangulate
  if (ringCount <= 0) return triangles

  // Compute start indices of each ring
  const ringStart: number[] = []
  let idx = 0
  for (let r = 0; r <= ringCount; r++) {
    ringStart.push(idx)
    const pointsInThisRing = r === 0 ? 1 : 6 * r
    idx += pointsInThisRing
  }

  // Ring0 → Ring1 triangles (center → ring1)
  const centerIdx = 0
  const ring1Start = ringStart[1]
  // Ring 1 always has 6 vertices
  const ring1Count = 6
  for (let i = 0; i < ring1Count; i++) {
    const next = (i + 1) % ring1Count
    // Ensure consistent front-face winding (CCW) relative to points order
    triangles.push(ring1Start + next, ring1Start + i, centerIdx)
  }

  // Ring n → Ring n+1
  for (let r = 1; r < ringCount; r++) {
    const innerStart = ringStart[r]
    const outerStart = ringStart[r + 1]
    // Counts per ring are deterministic: ring r has 6*r vertices
    const innerCount = 6 * r
    const outerCount = 6 * (r + 1)

    // divide outer ring edges into segments matching inner ring vertices
    let innerIdx = 0
    let outerIdx = 0
    for (let edge = 0; edge < 6; edge++) {
      const innerEdgeCount = r // midpoints per edge = ring number
      for (let step = 0; step < innerEdgeCount; step++) {
        const i0 = innerStart + (innerIdx % innerCount)       // inner current
        const i1 = outerStart + (outerIdx % outerCount)       // outer current
        const i2 = innerStart + ((innerIdx + 1) % innerCount) // inner next along edge
        const i3 = outerStart + ((outerIdx + 1) % outerCount) // outer next along edge

        // Two triangles per quad, keep winding consistent with ring1 fan above
        triangles.push(i1, i0, i2)
        triangles.push(i1, i2, i3)

        innerIdx++
        outerIdx++
      }
      // After r steps, innerIdx already points at the next corner.
      // Outer ring has r+1 points per edge (corner + r midpoints), so advance once more
      // to align to the next edge's starting corner.
      outerIdx++
    }
  }

  return triangles
}
