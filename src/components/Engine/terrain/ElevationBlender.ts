/*
ElevationBlender (neighbor height smoothing)

Purpose
- Provide simple algorithms to smooth/lerp heights between neighboring hex tiles for a more natural look.
- Decouple height logic from the mesh building so it can be unit-tested.

Implementation notes
- Neighborhood definition uses the project standard: POINTY-TOP with odd-r (row-offset).
- Wrap east/west (X), clamp north/south (Y) consistently with mapTools.
*/

import { useObjectsStore } from "@/stores/objectStore";
import type { WorldState } from "@/types/common";
import { Tile } from "@/objects/game/Tile";

export type ElevationBlenderOptions = {
  smoothing?: number; // [0..1] how much to blend with neighbors (0 = none, 1 = full avg)
  jitter?: number; // amplitude of noise added to heights (in world units)
  seed?: number; // optional seed for deterministic jitter
};

export class ElevationBlender {
  private readonly world: WorldState;
  private opts: Required<ElevationBlenderOptions>;
  private readonly tilesByKey: Record<string, Tile>;
  private heightMap: Float32Array | null = null;

  constructor(world: WorldState, options?: ElevationBlenderOptions) {
    this.world = world;
    this.opts = {
      smoothing: options?.smoothing ?? 0.6,
      jitter: options?.jitter ?? 0.04,
      seed: options?.seed ?? 1337,
    } as Required<ElevationBlenderOptions>;

    // todo new objStore getter: tilesByKey
    const objStore = useObjectsStore();
    const tiles = objStore.getClassGameObjects("tile") as Tile[];
    this.tilesByKey = {} as Record<string, Tile>;
    for (const t of tiles) this.tilesByKey[t.key] = t;
  }

  // --- helpers ---
  // todo use mapTools.getRealCoords
  private getTile(x: number, y: number): Tile | null {
    if (y < 0 || y >= this.world.sizeY) return null;
    // wrap x
    let wx = x % this.world.sizeX;
    if (wx < 0) wx += this.world.sizeX;
    const key = Tile.getKey(wx, y);
    return this.tilesByKey[key] ?? null;
  }

  // todo move to math
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // todo move to math
  private jitter(x: number, y: number): number {
    // Simple deterministic hash -> [-1, 1]
    const n = this.hash2D(x, y, this.opts.seed);
    return (n * 2 - 1) * this.opts.jitter;
  }

  private hash2D(x: number, y: number, seed: number): number {
    // integer hashing, returns [0,1)
    // todo "ESLint: This number literal will lose precision at runtime. (no-loss-of-precision)"
    let h = (x * 374761393 + y * 668265263 + seed * 1442695040888963407) >>> 0;
    h = (h ^ (h >> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return (h & 0xffffffff) / 0x100000000; // [0,1)
  }
}
