/*
TODO: ElevationBlender (neighbor height smoothing)

Purpose
- Provide simple algorithms to smooth/lerp heights between neighboring hex tiles for a more natural look.
- Decouple height logic from mesh building so it can be unit-tested.

Planned Public API (no implementation yet)
- constructor(world: WorldLike, options?: { smoothing: number })
- sampleBaseHeight(x: number, y: number): number
  - Returns the base height for a tile (from world/tile elevation data).
- computeBlendedHeight(x: number, y: number): number
  - Computes a height that blends this tile with its neighbors using the smoothing factor.
- precomputeAll(): void
  - Optionally precompute blended heights/caches for quicker mesh updates.
- getHeightMap(): Float32Array | number[] | null
  - Returns a packed height map if precomputed.
- dispose(): void

Notes
- Neighborhood definition uses project standard: POINTY-TOP with odd-r (row-offset).
*/
