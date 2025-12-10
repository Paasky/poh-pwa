/*
FogOfWar (visibility → alpha mask texture)

Purpose
- Convert logic-layer visibility (per-tile visible/seen states) into a GPU texture/mask used by terrain/material overlays.
- Allow partial updates when only a subset of tiles changes.

Planned Public API (implementation scaffold only)
- constructor (scene: Scene, size: Coords, tilesByKey: Record<string, Tile>, knownTileKeys: GameKey[], visibleTileKeys: GameKey[])
- build(): void
  - Allocates textures/materials/meshes needed for fog rendering.
- updateFromVisibility(visibility: VisibilityMapLike, changedTiles?: GameKey[]): void
  - Updates the fog mask; if changedTiles omitted, recompute full mask.
- getTexture(): Texture | null
  - Returns the alpha mask (A channel = fog alpha; RGB optional for explored tint).
- setEnabled(enabled: boolean): void
  - Toggles fog overlay on/off.
- dispose(): void
  - Releases GPU resources.

Internal Notes
- Consider dual-channel (visible/explored) with thresholds for dithering.
- Texture coordinate mapping must match TerrainMeshBuilder vertex UVs.
*/

import type { Scene, Texture } from "@babylonjs/core";
import type { Coords } from "@/helpers/mapTools";
import type { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";

// Minimal visibility-like contract the renderer can consume
export type VisibilityMapLike = {
  knownTileKeys: Iterable<GameKey>;
  visibleTileKeys: Iterable<GameKey>;
};

// Scaffold: converts logic visibility to a GPU alpha mask texture
export class FogOfWar {
  // Inputs / configuration
  readonly scene: Scene;
  readonly size: Coords;
  readonly tilesByKey: Record<string, Tile>;

  // Initial state coming from game logic
  knownTileKeys: GameKey[];
  visibleTileKeys: GameKey[];

  // GPU resource the materials will sample (A = fog alpha)
  private texture: Texture | null = null;

  // Control flags
  private enabled = true;
  private dirty = true; // when true, mask needs full rebuild

  constructor(
    scene: Scene,
    size: Coords,
    tilesByKey: Record<string, Tile>,
    knownTileKeys: GameKey[],
    visibleTileKeys: GameKey[],
  ) {
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;
    this.knownTileKeys = knownTileKeys;
    this.visibleTileKeys = visibleTileKeys;
  }

  build(): void {
    // TODO: Allocate a DynamicTexture sized for the world (or atlas) and initialize pixels from
    //       this.knownTileKeys (explored) and this.visibleTileKeys (currently visible).
    //       Consider an A8 texture (alpha only) or RGBA with optional explored tint.
    //       Cache tile → texel mapping for partial updates.
    this.dirty = false;
  }

  updateFromVisibility(visibility: VisibilityMapLike, changedTiles?: GameKey[]): void {
    // TODO: If changedTiles is provided, only update those texels; otherwise recompute full mask.
    //       Update internal knownTileKeys/visibleTileKeys as arrays for consistent usage.
    this.knownTileKeys = Array.from(visibility.knownTileKeys);
    this.visibleTileKeys = Array.from(visibility.visibleTileKeys);
    // TODO: Write pixels into the underlying DynamicTexture and mark it updated.
  }

  getTexture(): Texture | null {
    // NOTE: Will remain null until build() creates it.
    return this.texture;
  }

  setEnabled(enabled: boolean): void {
    // TODO: If using a dedicated overlay mesh/material, toggle visibility or bind/unbind texture.
    this.enabled = enabled;
  }

  dispose(): void {
    // TODO: Dispose the underlying DynamicTexture and any helper meshes/materials.

    this.texture?.dispose?.();
    this.texture = null;
  }
}
