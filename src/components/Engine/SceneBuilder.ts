/*
TODO: SceneBuilder (assemble terrain + overlays)

Purpose
- Construct all BabylonJS-visible content for the world: terrain mesh, feature instances, and overlay layers (fog of war, selection, hover, path previews).
- Keep this purely visual; no game rules or pathfinding.

Planned Public API (no implementation yet)
- build(scene: SceneLike, world: WorldLike, options?: BuildOptions): void
  - Creates terrain SPS/mesh, materials, and overlay managers.
  - Calls into TerrainMeshBuilder, TerrainMaterial, ElevationBlender, and feature instancers.
- dispose(): void
  - Disposes meshes/materials/textures created by this builder.
- refreshTerrainHeights(): void
  - Rebuilds or morphs the terrain mesh when heights change.
- refreshFeatures(): void
  - Re-instantiates/updates instanced meshes (resources, improvements, etc.).
- getFogOfWar(): FogOfWarLike | null
  - Returns the fog overlay manager for external updates.

Dependencies (visual-only)
- ./terrain/TerrainMeshBuilder
- ./terrain/TerrainMaterial
- ./terrain/ElevationBlender
- ./features/*Instancer
- ./FogOfWar
- ./interaction/PathPreview

Notes
- This should not own the engine/scene lifecycle (use Engine.ts / EngineService for that).
- WorldLike is the headless model owner of tiles and visibility.
- All dependencies (terrain/*, features/*, interaction/*) remain decoupled and testable.
*/
