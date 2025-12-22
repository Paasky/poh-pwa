import type { GameKey } from "@/objects/game/_GameObject";
import type { TurnEnd } from "@/services/MovementService";
import type { UnitDesign } from "@/objects/game/UnitDesign";
import type { TypeKey } from "@/types/common";

const cache = new Map<string, Map<GameKey, Map<GameKey, number | TurnEnd | null>>>();

// Used to always generate cacheKey from relevant keys in the same order
// NOTE: Keep in-sync with keys used in MovementService.baseCost()
const getRelevantSpecialKeys = (specialKeys: Set<TypeKey>): Set<TypeKey> => {
  const relevantKeys = new Set<TypeKey>();

  (
    [
      "specialType:canEmbark",
      "specialType:canEnterSea",
      "specialType:canEnterOcean",
      "specialType:canEnterIce",
      "specialType:canEnterMountains",
    ] as TypeKey[]
  ).forEach((key) => specialKeys.has(key) && relevantKeys.add(key));

  return relevantKeys;
};

const getCacheKey = (design: UnitDesign, specialKeys: Set<TypeKey>): string => {
  return [design.platform.key, design.equipment.key, ...getRelevantSpecialKeys(specialKeys)].join(
    ",",
  );
};

// todo: use this when a tile is mutated (feature/pollution/route/etc changes)
const resetCache = (tileKeys?: GameKey[]): void => {
  if (tileKeys) {
    // Clear each given Tile.key from both from.key & to.key caches
    for (const tileKey of tileKeys) {
      for (const cacheForObjPerFromTile of cache.values()) {
        // Clear the tile from the from.key cache
        cacheForObjPerFromTile.delete(tileKey);

        // Loop each remaining from.key cache
        for (const cacheForObjPerToTile of cacheForObjPerFromTile.values()) {
          // Clear the tile from the to.key cache
          cacheForObjPerToTile.delete(tileKey);
        }
      }
    }
    return;
  }

  // No tile keys given, just clear the whole thing
  cache.clear();
};

const getMoveCost = (
  cacheKey: string,
  from: GameKey,
  to: GameKey,
): number | TurnEnd | null | undefined => {
  return cache.get(cacheKey)?.get(from)?.get(to);
};

const setMoveCost = (
  cacheKey: string,
  from: GameKey,
  to: GameKey,
  cost: number | TurnEnd | null,
): void => {
  const cacheForObjPerFromTile = cache.get(cacheKey);
  if (!cacheForObjPerFromTile) {
    cache.set(cacheKey, new Map([[from, new Map([[to, cost]])]]));
    return;
  }

  const cacheForObjPerToTile = cacheForObjPerFromTile.get(from);
  if (!cacheForObjPerToTile) {
    cacheForObjPerFromTile.set(from, new Map([[to, cost]]));
    return;
  }

  cacheForObjPerToTile.set(to, cost);
};

// Lazy-loading Cache of base movement cost between tiles, reduces A* pathfinding & path walking computing costs by approx. 99.99%
export function useMoveCostCache() {
  return { cache, getCacheKey, getMoveCost, resetCache, setMoveCost };
}
