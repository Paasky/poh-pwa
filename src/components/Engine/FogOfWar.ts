/*
TODO: FogOfWar (visibility → alpha mask texture)

Purpose
- Convert logic-layer visibility (per-tile visible/seen states) into a GPU texture/mask used by terrain/material overlays.
- Allow partial updates when only a subset of tiles changes.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike, options?: { textureSize?: number; smoothEdges?: boolean })
- build(): void
  - Allocates textures/materials/meshes needed for fog rendering.
- updateFromVisibility(visibility: VisibilityMapLike, changedTiles?: GameKey[]): void
  - Updates the fog mask; if changedTiles omitted, recompute full mask.
- getTexture(): TextureLike | null
  - Returns the alpha mask (A channel = fog alpha; RGB optional for explored tint).
- setEnabled(enabled: boolean): void
  - Toggles fog overlay on/off.
- dispose(): void
  - Releases GPU resources.

Internal Notes
- Consider dual-channel (visible/explored) with thresholds for dithering.
- Texture coordinate mapping must match TerrainMeshBuilder vertex UVs.
*/
