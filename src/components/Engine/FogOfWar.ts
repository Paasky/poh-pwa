import type { Scene } from "@babylonjs/core";
import type { Coords } from "@/helpers/mapTools";
import type { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";

export class FogOfWar {
  // === Fog of War tunables (kept internal; not user-adjustable) ===
  // How much to dim explored-but-not-currently-visible tiles (0..1, multiplier)
  exploredDim = 0.33;
  // Alpha to blend unknown areas toward black (0..1)
  // Dev QoL: set to 0.75 so player can orient on the map
  unknownDim = 0.75;

  // Inputs / configuration
  readonly scene: Scene;
  readonly size: Coords;
  readonly tilesByKey: Record<string, Tile>;

  // Logical state
  knownKeys: Set<GameKey>;
  visibleKeys: Set<GameKey>;

  constructor(
    scene: Scene,
    size: Coords,
    tilesByKey: Record<string, Tile>,
    knownTileKeys: GameKey[],
    visibleTileKeys: GameKey[],
  ) {
    // Required fields initialized in constructor (no lazy nulls)
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;

    this.knownKeys = new Set(knownTileKeys);
    this.visibleKeys = new Set(visibleTileKeys);

    // todo init required internals

    this.process();
  }

  addAndSetTiles(addKnownKeys: GameKey[], setVisibleKeys?: GameKey[]): this {
    addKnownKeys.forEach((k) => this.knownKeys.add(k));
    if (setVisibleKeys) this.visibleKeys = new Set(setVisibleKeys);
    this.process();

    return this;
  }

  dispose(): void {
    // todo dispose of all data created during my lifespan
    //  (this function is only called on full engine shut-down, so this class will be garbage-collected away soon)
  }

  private process(): this {
    // todo process the buffer and update the texture
    return this;
  }
}
