/**
 * Generate triangles for any kN hex tile
 * @param ringCount - N (number of rings)
 */
export function hexTrianglesFromPoints(ringCount: number): number[] {
  const triangles: number[] = [];

  // No rings beyond the center → nothing to triangulate
  if (ringCount <= 0) return triangles;

  // Compute start indices of each ring
  const ringStart: number[] = [];
  let idx = 0;
  for (let r = 0; r <= ringCount; r++) {
    ringStart.push(idx);
    const pointsInThisRing = r === 0 ? 1 : 6 * r;
    idx += pointsInThisRing;
  }

  // Ring0 → Ring1 triangles (center → ring1)
  const centerIdx = 0;
  const ring1Start = ringStart[1];
  // Ring 1 always has 6 vertices
  const ring1Count = 6;
  for (let i = 0; i < ring1Count; i++) {
    const next = (i + 1) % ring1Count;
    // Ensure consistent front-face winding (CCW) relative to points order
    triangles.push(ring1Start + next, ring1Start + i, centerIdx);
  }

  // Ring n → Ring n+1
  for (let r = 1; r < ringCount; r++) {
    const innerStart = ringStart[r];
    const outerStart = ringStart[r + 1];
    // Counts per ring are deterministic: ring r has 6*r vertices
    const innerCount = 6 * r;
    const outerCount = 6 * (r + 1);

    // divide outer ring edges into segments matching inner ring vertices
    let innerIdx = 0;
    let outerIdx = 0;

    const firstI1 = outerStart + (outerIdx % outerCount); // the last triangle of last step of last edge connects to this one
    for (let edge = 0; edge < 6; edge++) {
      const innerEdgeCount = r; // midpoints per edge = ring number
      for (let step = 0; step < innerEdgeCount; step++) {
        const i0 = innerStart + (innerIdx % innerCount); // inner current
        const i1 = outerStart + (outerIdx % outerCount); // outer current
        const i2 = innerStart + ((innerIdx + 1) % innerCount); // inner next along edge
        const i3 = outerStart + ((outerIdx + 1) % outerCount); // outer next along edge

        // Three triangles per quad. Use the alternate diagonal to improve visual continuity
        // across the ring stitching
        // Keep overall winding consistent with the ring1 fan above.
        triangles.push(i0, i3, i1);
        triangles.push(i0, i2, i3);

        if (step === innerEdgeCount - 1 && edge === 5) {
          // Last step of last edge: connect to 1st i1
          triangles.push(i2, firstI1, i3);
        } else {
          // first 5 edges: connect to next edge i1
          const i4 = outerStart + 1 + ((outerIdx + 1) % outerCount); // outer 2nd next along edge
          triangles.push(i2, i4, i3);
        }

        innerIdx++;
        outerIdx++;
      }
      // After r steps, innerIdx already points at the next corner.
      // Outer ring has r+1 points per edge (corner + r midpoints), so advance once more
      // to align to the next edge's starting corner.
      outerIdx++;
    }
  }

  return triangles;
}
