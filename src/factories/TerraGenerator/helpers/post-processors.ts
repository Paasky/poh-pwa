import { getRandom } from "@/helpers/arrayTools";
import { useDataBucket } from "@/Data/useDataBucket";
import { GenTile } from "@/factories/TerraGenerator/gen-tile";
import { Tetris } from "@/factories/TerraGenerator/helpers/tetris";
import { generateKey } from "@/Common/Models/_GameModel";
import { Coords, getHexNeighborCoords, getTile } from "@/helpers/mapTools";
import { TerraGenerator } from "@/factories/TerraGenerator/terra-generator";
import { AcceptResult, Snake } from "@/factories/TerraGenerator/helpers/snake";
import { River } from "@/Common/Models/River";

export const removeOrphanArea = (tile: GenTile, neighbors: GenTile[]): void => {
  if (neighbors.length === 0) return;

  // If any neighbor has the same area, or all are a different domain (I'm a lake/island)
  // -> skip
  const hasSameArea = neighbors.some((n) => n.area.key === tile.area.key);
  const allDiffDomain = neighbors.every((n) => n.domain.key !== tile.domain.key);
  if (hasSameArea || allDiffDomain) return;

  const ref = getRandom(neighbors);
  // If the domain changes, also change climate and terrain
  if (tile.domain !== ref.domain && tile.canChangeDomain()) {
    tile.domain = ref.domain;
    tile.climate = ref.climate;
    tile.terrain = ref.terrain;
  }
  tile.area = ref.area;
};

export const removeOrphanTerrain = (
  tile: GenTile,
  neighbors: GenTile[],
  ignoreLakes = true,
): void => {
  if (neighbors.length === 0) return;

  const allDiffTerrain = neighbors.every((n) => n.terrain.key !== tile.terrain.key);
  if (!allDiffTerrain) return;

  const ref = getRandom(neighbors);
  // If the domain changes, also change the area
  if (ref.domain !== tile.domain) {
    // If we should not flip lakes/land, skip when one side is lake and the other is land
    if (ignoreLakes) {
      const isLakeHere = tile.terrain.id === "lake";
      const isLakeThere = ref.terrain.id === "lake";
      const becomesLandFromLake = isLakeHere && ref.domain.key === "domainType:land";
      const becomesLakeFromLand = isLakeThere && tile.domain.key === "domainType:land";
      if (becomesLandFromLake || becomesLakeFromLand) return;
    }
    tile.area = ref.area;
  }
  tile.domain = ref.domain;
  tile.climate = ref.climate;
  tile.terrain = ref.terrain;
};

/**
 * Create a small tetris-like island around (cx, cy).
 * - Converts eligible tiles to land with terrain based on climate.
 * - Elevation is set to 'hill' (default) or 'flat'.
 * - Respects tile.canChangeDomain() and stays within bounds with wrapping X.
 */
export const makeIsland = (
  gen: TerraGenerator,
  coords: Coords,
  level: "reg" | "game",
  hillChance: number = 0.5,
): void => {
  const offsets = Tetris.randomOffsets();
  const size = level === "reg" ? gen.regSize : gen.size;
  const tiles = level === "reg" ? gen.regTiles : gen.gameTiles;
  const elevType = Math.random() < hillChance ? gen.hill : gen.flat;

  const center = getTile(size, coords, tiles);
  for (const o of offsets) {
    const t = getTile(size, { x: coords.x + o.dx, y: coords.y + o.dy }, tiles);
    if (!t) continue;
    if (!t.canChangeDomain()) continue;
    const climate = (center || t).climate;
    t.domain = gen.land;
    t.terrain = gen.getLandTerrainFromClimate(climate);
    t.elevation = elevType;
    t.isFresh = false;
    t.isSalt = false;
  }
};

export const mountainRange = (
  start: GenTile,
  tiles: Record<string, GenTile>,
  size: { x: number; y: number },
): GenTile[] => {
  const mountain = useDataBucket().getType("elevationType:mountain");
  const snowMountain = useDataBucket().getType("elevationType:snowMountain");

  let waterCount = 0;
  return new Snake(
    size,
    tiles,
    (tile) => {
      // If we've hit too many non-lake water tiles, stop early
      if (tile.domain.id === "water" && tile.terrain.id !== "lake") {
        waterCount++;
        return waterCount < 3;
      }

      tile.elevation =
        tile.elevation === mountain || tile.elevation === snowMountain || Math.random() > 0.9
          ? snowMountain
          : mountain;

      return true;
    },
    undefined,
    { method: "chebyshev" },
  ).walk(start);
};

/**
 * Generic tile crawler.
 * - Tracks seen tiles (by key) to avoid cycles; accepts an external Set to share state between calls.
 * - Uses 8-directional adjacency.
 * - Only traverses into neighbors for which isValid(tile) returns true.
 */
export const crawlTiles = (
  gen: TerraGenerator,
  level: "strat" | "reg" | "game",
  start: GenTile,
  seenTiles: Set<string>,
  isValid: (tile: GenTile) => boolean,
): GenTile[] => {
  // Non-recursive DFS to minimize call stack depth
  const result: GenTile[] = [];
  const stack: GenTile[] = [];

  // Only proceed if the starting tile is valid
  if (!start || !isValid(start)) return result;

  stack.push(start);
  while (stack.length) {
    const current = stack.pop() as GenTile;
    if (!current) continue;

    if (seenTiles.has(current.key)) continue;
    seenTiles.add(current.key);
    result.push(current);

    // Use TerraGenerator neighbor helpers (no duplicated neighbor math)
    let neighborTiles: GenTile[] = [];
    const cx = (current as GenTile).x;
    const cy = (current as GenTile).y;
    if (level === "game") {
      neighborTiles = gen.getGameNeighbors({ x: cx, y: cy }, 1);
    } else if (level === "reg") {
      neighborTiles = gen.getRegNeighbors({ x: cx, y: cy }, "chebyshev", 1);
    } else {
      neighborTiles = gen.getStratNeighbors({ x: cx, y: cy }, "chebyshev", 1);
    }

    for (const neighbor of neighborTiles) {
      if (seenTiles.has(neighbor.key)) continue;
      if (!isValid(neighbor)) continue; // stop crawling that direction
      stack.push(neighbor);
    }
  }

  return result;
};

/**
 * Spread salt water marking from a starting tile across contiguous water tiles.
 * - Crawls in 8 directions but only through water; land tiles are not traversed.
 * - On every visited water tile, sets tile.isSalt = true.
 */
export const spreadSalt = (gen: TerraGenerator, start: GenTile): void => {
  const seen = new Set<string>();
  const waterCheck = (t: GenTile) => t.domain.id === "water";
  const visited = crawlTiles(gen, "game", start, seen, waterCheck);
  for (const t of visited) {
    t.isSalt = true;
  }
};

/**
 * Generate a river path starting at `start` and meandering until it reaches
 * salt water (ocean/sea/coast) or merges with another river.
 * - Removes feature on each visited tile.
 * - Marks visited tiles with tile.isRiver = true and tile.riverKey = river.key.
 * - If it hits a Mountain tile, tries alternative directions in random order; if none, passes through.
 * - If it hits another river, marks that river's tiles from the confluence onward as isMajorRiver = true.
 * - Keeps all other tile data intact.
 */
export const makeRiver = (
  size: Coords,
  start: GenTile,
  tiles: Record<string, GenTile>,
  rivers: Record<string, River>,
): River => {
  const floodPlain = useDataBucket().getType("featureType:floodPlain");
  const river = new River(generateKey("river"), "River", []);
  rivers[river.key] = river;

  // Keep track of the current/end-state
  let majorMode = false;
  let metRiverTile: GenTile | null = null;

  new Snake(
    size,
    tiles,
    (tile): boolean => {
      // Convert tile to River
      tile.isFresh = true;
      tile.riverKey = river.key;
      river.tileKeys.push(tile.key);
      if (majorMode) {
        tile.isMajorRiver = true;
        if (tile.domain.id === "land") {
          tile.terrain = useDataBucket().getType("terrainType:majorRiver");
          tile.feature = null;
        }
      }

      const neighbors = getHexNeighborCoords(size, tile).map((c) => getTile(size, c, tiles)!);

      // First pass: update neighbors
      for (const neighbor of neighbors) {
        // Spread Fresh water to all land neighbors
        if (neighbor.domain.id === "land") {
          neighbor.isFresh = true;
        }

        // Spread Flood Plains to empty desert neighbors
        if (neighbor.terrain.id === "desert" && !neighbor.feature) {
          neighbor.feature = floodPlain;
        }

        // If we're next to a lake, turn on major mode
        if (neighbor.terrain.id === "lake") {
          majorMode = true;

          // if the neighbor is not a river tile, we become a lake
          if (!neighbor.riverKey) {
            tile.domain = neighbor.domain;
            tile.terrain = neighbor.terrain;
            tile.elevation = neighbor.elevation;
            tile.feature = null;
          }
        }
      }

      // Second pass: stop if needed
      for (const neighbor of neighbors) {
        // If we're at the coast, stop
        if (neighbor.isSalt) {
          return false;
        }

        // If we're next to another river, stop and mark the confluence tile for downstream promotion
        if (neighbor.riverKey && neighbor.riverKey !== river.key) {
          metRiverTile = neighbor;
          return false;
        }
      }

      // Otherwise keep going
      return true;
    },
    (tile): AcceptResult => {
      // Block mountain tiles
      if (tile.elevation.id === "mountain" || tile.elevation.id === "snowMountain") {
        return "blocked";
      }

      // Block if the tile has my river neighbors
      if (
        getHexNeighborCoords(size, tile)
          .map((c) => getTile(size, c, tiles)!)
          .some((n) => n.riverKey === river.key && n.key !== tile.key)
      ) {
        return "blocked";
      }

      // Otherwise trust onVisit to stop on bad neighbors
      return true;
    },
    {
      legs: [9999],
    },
  ).walk(start);

  // If we merged into another river, mark downstream as major
  if (metRiverTile) {
    const otherRiver = rivers[(metRiverTile as GenTile).riverKey!] as River;
    const otherRiverTileKeys = otherRiver.tileKeys;
    const metAtIdx = otherRiverTileKeys.indexOf((metRiverTile as GenTile).key);
    if (metAtIdx !== -1) {
      for (let i = metAtIdx; i < otherRiverTileKeys.length; i++) {
        const tileKey = otherRiverTileKeys[i];
        tiles[tileKey].isMajorRiver = true;
        if (tiles[tileKey].domain.id === "land") {
          tiles[tileKey].terrain = useDataBucket().getType("terrainType:majorRiver");
          tiles[tileKey].feature = null;
        }
      }
    }
  }

  return river;
};
