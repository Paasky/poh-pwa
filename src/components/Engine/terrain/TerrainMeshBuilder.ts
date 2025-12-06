/*
TODO: TerrainMeshBuilder (SPS build from tiles)

Purpose
- Build a single BabylonJS SPS/mesh representing the 2D hex grid (top‑down view) from the headless Tile[][].
- Provide hooks to update heights/colors efficiently (partial updates when possible).

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike, options?: TerrainOptions)
- build(): void
  - Creates the SPS or merged mesh for terrain hexes; assigns material.
- setMaterial(material: MaterialLike): void
  - Applies or updates the terrain material.
- updateHeights(changedTiles?: GameKey[]): void
  - Recomputes vertex heights/elevations; supports partial region updates.
- updateColors(changedTiles?: GameKey[]): void
  - Recomputes vertex colors based on terrain/biome/resource flags.
- getMesh(): MeshLike | null
  - Returns the built mesh for adding to scene.
- dispose(): void
  - Disposes mesh/SPS and related buffers.

Notes
- UV layout and vertex color packing must align with TerrainMaterial expectations.
- Hex layout standard: POINTY-TOP with odd-r (row-offset) coordinates. Keep any
  axial/cube conversions consistent with this orientation.
*/
