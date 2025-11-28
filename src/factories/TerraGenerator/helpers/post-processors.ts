import { getRandom, takeRandom } from '@/helpers/arrayTools'
import { snake } from '@/factories/TerraGenerator/helpers/snake'
import { useObjectsStore } from '@/stores/objectStore'
import { GenTile } from '@/factories/TerraGenerator/gen-tile'
import { Tetris } from '@/factories/TerraGenerator/helpers/tetris'
import { GameKey, generateKey, River, Tile } from '@/objects/gameObjects'

export const removeOrphanArea = (
  tile: GenTile,
  neighbors: GenTile[]
): void => {
  if (neighbors.length === 0) return

  // If any neighbor has the same area, or all are a different domain (I'm a lake/island)
  // -> skip
  const hasSameArea = neighbors.some(n => n.area.key === tile.area.key)
  const allDiffDomain = neighbors.every(n => n.domain.key !== tile.domain.key)
  if (hasSameArea || allDiffDomain) return

  const ref = getRandom(neighbors)
  // If the domain changes, also change climate and terrain
  if (tile.domain !== ref.domain && tile.canChangeDomain()) {
    tile.domain = ref.domain
    tile.climate = ref.climate
    tile.terrain = ref.terrain
  }
  tile.area = ref.area
}

export const removeOrphanTerrain = (
  tile: GenTile,
  neighbors: GenTile[],
  ignoreLakes = true,
): void => {
  if (neighbors.length === 0) return

  const allDiffTerrain = neighbors.every(n => n.terrain.key !== tile.terrain.key)
  if (!allDiffTerrain) return

  const ref = getRandom(neighbors)
  // If the domain changes, also change the area
  if (ref.domain !== tile.domain) {
    // If we should not flip lakes/land, skip when one side is lake and the other is land
    if (ignoreLakes) {
      const isLakeHere = tile.terrain.id === 'lake'
      const isLakeThere = ref.terrain.id === 'lake'
      const becomesLandFromLake = isLakeHere && ref.domain.key === 'domainType:land'
      const becomesLakeFromLand = isLakeThere && tile.domain.key === 'domainType:land'
      if (becomesLandFromLake || becomesLakeFromLand) return
    }
    tile.area = ref.area
  }
  tile.domain = ref.domain
  tile.climate = ref.climate
  tile.terrain = ref.terrain
}

/**
 * Create a small tetris-like island around (cx, cy).
 * - Converts eligible tiles to land with terrain based on climate.
 * - Elevation is set to 'hill' (default) or 'flat'.
 * - Respects tile.canChangeDomain() and stays within bounds with wrapping X.
 */
export const makeIsland = (
  gen: any,
  cx: number,
  cy: number,
  level: 'reg' | 'game',
  hillChance: number = 0.5,
): void => {
  const offsets = Tetris.randomOffsets()
  const size = level === 'reg' ? gen.regSize : gen.size
  const tiles = level === 'reg' ? gen.regTiles : gen.gameTiles
  const elevType = Math.random() < hillChance ? gen.hill : gen.flat

  const center = gen.getTile(cx, cy, size, tiles)
  for (const o of offsets) {
    const t = gen.getTile(cx + o.dx, cy + o.dy, size, tiles)
    if (!t) continue
    if (!t.canChangeDomain()) continue
    const climate = (center || t).climate
    t.domain = gen.land
    t.terrain = gen.getLandTerrainFromClimate(climate)
    t.elevation = elevType
    t.isFresh = false
    t.isSalt = false
  }
}

export const mountainRange = (
  start: GenTile,
  tiles: Record<string, GenTile>,
  size: { x: number, y: number }
): GenTile[] => {
  const mountain = useObjectsStore().getTypeObject('elevationType:mountain')
  const snowMountain = useObjectsStore().getTypeObject('elevationType:snowMountain')

  const walkedTiles: GenTile[] = []
  let waterCount = 0
  snake(
    start,
    tiles,
    walkedTiles,
    size,
    [4, 5],
    [3, 4],
    (tile: GenTile): boolean => {
      if (tile.domain.id === 'water' && tile.terrain.id !== 'lake') {
        waterCount++
        return waterCount < 3
      }

      tile.elevation = tile.elevation === mountain || tile.elevation === snowMountain || Math.random() > 0.9 ? snowMountain : mountain
      return true
    }
  )
  return walkedTiles
}

/**
 * Generic tile crawler.
 * - Tracks seen tiles (by key) to avoid cycles; accepts an external Set to share state between calls.
 * - Uses 8-directional adjacency.
 * - Only traverses into neighbors for which isValid(tile) returns true.
 */
export const crawlTiles = (
  gen: any,
  level: 'strat' | 'reg' | 'game',
  start: GenTile | Tile,
  seenTiles: Set<string>,
  isValid: (tile: GenTile | Tile) => boolean,
): (GenTile | Tile)[] => {
  // Non-recursive DFS to minimize call stack depth
  const result: (GenTile | Tile)[] = []
  const stack: (GenTile | Tile)[] = []

  // Only proceed if the starting tile is valid
  if (!start || !isValid(start)) return result

  stack.push(start)
  while (stack.length) {
    const current = stack.pop() as GenTile | Tile
    if (!current) continue

    if (seenTiles.has(current.key)) continue
    seenTiles.add(current.key)
    result.push(current)

    // Use TerraGenerator neighbor helpers (no duplicated neighbor math)
    let neighborTiles: GenTile[] = []
    const cx = (current as GenTile).x
    const cy = (current as GenTile).y
    if (level === 'game') {
      neighborTiles = gen.getGameNeighbors(cx, cy, 'chebyshev', 1)
    } else if (level === 'reg') {
      neighborTiles = gen.getRegNeighbors(cx, cy, 'chebyshev', 1)
    } else {
      neighborTiles = gen.getStratNeighbors(cx, cy, 'chebyshev', 1)
    }

    for (const neighbor of neighborTiles) {
      if (seenTiles.has(neighbor.key)) continue
      if (!isValid(neighbor)) continue // stop crawling that direction
      stack.push(neighbor)
    }
  }

  return result
}

/**
 * Spread salt water marking from a starting tile across contiguous water tiles.
 * - Crawls in 8 directions but only through water; land tiles are not traversed.
 * - On every visited water tile, sets tile.isSalt = true.
 */
export const spreadSalt = (
  gen: any,
  level: 'strat' | 'reg' | 'game',
  start: GenTile | Tile,
): void => {
  const seen = new Set<string>()
  const waterCheck = (t: GenTile | Tile) => t.domain.id === 'water'
  const visited = crawlTiles(gen, level, start, seen, waterCheck)
  for (const t of visited) {
    ;(t as GenTile).isSalt = true
  }
}

/**
 * Generate a river path starting at `start` and meandering until it reaches
 * salt water (ocean/sea/coast) or merges with another river.
 * - Removes feature on each visited tile.
 * - Marks visited tiles with tile.isRiver = true and tile.riverKey = river.key.
 * - If it hits a Mountain tile, tries alternative directions in random order; if none, passes through.
 * - If it hits another river, marks that river's tiles from the confluence onward as isMajorRiver = true.
 * - Keeps all other tile data intact.
 */
export const river = (
  gen: any,
  start: GenTile,
  level: 'reg' | 'game' = 'game'
): River => {
  const obj = useObjectsStore()

  // Resolve tile map and size for the chosen level
  const tiles: Record<string, GenTile> = level === 'reg' ? gen.regTiles : gen.gameTiles
  const size: { x: number, y: number } = level === 'reg' ? gen.regSize : gen.size

  // Elevation references
  const mountain = obj.getTypeObject('elevationType:mountain')
  const snowMountain = obj.getTypeObject('elevationType:snowMountain')

  // Create and register a new River object
  const river = new River(generateKey('river'))
  obj.set(river)

  const walked: GenTile[] = []
  let metRiverKey: GameKey | null = null
  let metAtTileKey: GameKey | null = null

  // Pick a random initial direction
  const initialDir = takeRandom(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) as any

  snake(
    start,
    tiles,
    walked,
    size,
    // "Endless" meander with variability
    [9999],
    [2, 3, 4],
    // acceptTile: decide whether to continue, block, or stop
    (tile: GenTile) => {
      const actual = tiles[tile.key] || tile
      if (actual.isSalt) return false

      // If we encountered an existing river, stop and record confluence
      if (actual.riverKey && actual.riverKey !== river.key) {
        metRiverKey = actual.riverKey
        metAtTileKey = actual.key
        return false
      }

      // Mountains block; try rerouting
      if (actual.elevation === mountain || actual.elevation === snowMountain) return 'blocked'

      // Otherwise we can proceed
      return true
    },
    initialDir,
    // onVisit: mutate tile to include river
    (tile: GenTile) => {
      // Always mutate the canonical tile object from the tiles map
      const real = tiles[tile.key] || tile
      real.riverKey = river.key
      real.isFresh = true
    }
  )

  // Finalize the new river's path and make neighbors fresh water sources
  for (const t of walked) {
    const neighs = gen.getGameNeighbors
      ? (level === 'reg' ? gen.getRegNeighbors(t.x, t.y, 'chebyshev', 1) : gen.getGameNeighbors(t.x, t.y, 'chebyshev', 1))
      : []
    for (const n of neighs) {
      n.isFresh = true
    }
  }
  river.tileKeys.value.push(...walked.map(t => t.key))

  // If we merged into another river, mark its downstream as major
  if (metRiverKey && metAtTileKey) {
    const otherRiver = obj.get(metRiverKey) as River
    const otherRiverTileKeys = otherRiver.tileKeys.value
    const metAtIdx = otherRiverTileKeys.indexOf(metAtTileKey)
    if (metAtIdx !== -1) {
      for (let i = metAtIdx; i < otherRiverTileKeys.length; i++) {
        const tileKey = otherRiverTileKeys[i]
        tiles[tileKey].isMajorRiver = true
      }
    }
  }

  return river
}