/*
TODO: TerrainMaterial (simple triplanar or color lookup)

Purpose
- Provide a material/shader for the hex terrain mesh that can:
  - Color tiles by terrain/biome/elevation (lookup texture or vertex colors).
  - Optionally blend elevations or supply simple shading.
  - Sample FogOfWar alpha mask to dim unexplored areas.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, options?: MaterialOptions)
- build(): void
  - Creates the underlying BabylonJS material/shader and any lookup textures.
- setFogTexture(tex: TextureLike | null): void
  - Wire the fog alpha mask texture; null disables fog sampling.
- setColorLookup(tex: TextureLike | null): void
  - Assigns a color lookup map per terrain/biome.
- getMaterial(): MaterialLike | null
  - Returns the material to assign to the terrain mesh.
- dispose(): void
  - Disposes material and related textures.

Notes
- Start minimal (vertex colors), add triplanar later if needed.
- Keep uniforms/defines in sync with TerrainMeshBuilder attributes.
*/
