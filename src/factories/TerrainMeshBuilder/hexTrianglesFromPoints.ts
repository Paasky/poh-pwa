import { PointData } from '@/factories/TerrainMeshBuilder/_terrainMeshTypes'

/**
 * Generate triangles for any kN hex tile
 * @param points - array returned by pointsInRing(0..N)
 * @param ringCount - N (number of rings)
 */
export function hexTrianglesFromPoints (points: PointData[], ringCount: number): number[] {
  const triangles: number[] = []

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
  const ring1Count = ringStart[2] - ring1Start
  for (let i = 0; i < ring1Count; i++) {
    const next = (i + 1) % ring1Count
    triangles.push(ring1Start + i, ring1Start + next, centerIdx)
  }

  // Ring n → Ring n+1
  for (let r = 1; r < ringCount; r++) {
    const innerStart = ringStart[r]
    const outerStart = ringStart[r + 1]
    const innerCount = ringStart[r + 1] - innerStart
    const outerCount = ringStart[r + 2] - outerStart

    // divide outer ring edges into segments matching inner ring vertices
    let innerIdx = 0
    let outerIdx = 0
    for (let edge = 0; edge < 6; edge++) {
      const innerEdgeCount = r // midpoints per edge = ring number
      for (let step = 0; step < innerEdgeCount; step++) {
        const i0 = innerStart + innerIdx
        const i1 = outerStart + outerIdx
        const i2 = innerStart + innerIdx + 1
        const i3 = outerStart + outerIdx + 1

        triangles.push(i0, i1, i2)
        triangles.push(i2, i1, i3)

        innerIdx++
        outerIdx++
      }
      innerIdx++ // skip corner
      outerIdx++ // skip corner
    }
  }

  return triangles
}
