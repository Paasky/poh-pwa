import { Tile } from '@/objects/gameObjects'
import { TypeKey } from '@/types/common'
import { TypeClass, TypeObject } from '@/types/typeObjects'
import { WorldSize } from '@/factories/worldFactory'
import { useObjectsStore } from '@/stores/objectStore'
import { getRandom, takeRandom } from '@/helpers/arrayTools'
import { mountainRange, removeOrphanArea } from '@/factories/TerraGenerator/postProcessors'
import { Tetris } from '@/factories/TerraGenerator/tetris'

export class GenTile extends Tile {
  isContinentCenter = false
  isStart: 'major' | 'minor' | null = null

  canBeLand () {
    return !this.isSalt
  }

  canBeStart () {
    return !this.isStart && this.domain.key === 'domainType:land'
  }

  canBeWater () {
    return !this.isStart && !this.isContinentCenter
  }

  canChangeDomain () {
    return this.domain.key === 'domainType:land'
      ? this.canBeWater()
      : this.canBeLand()
  }
}

export type ContinentData = {
  type: TypeObject,
  center: GenTile,
  majorStarts: { strat: GenTile[], reg: GenTile[], game: GenTile[] },
  minorStarts: { strat: GenTile[], reg: GenTile[], game: GenTile[] },
}

export class TerraGenerator {
  size: WorldSize
  regSize: { x: number, y: number }
  stratSize: { x: number, y: number }

  continents: Record<string, ContinentData> = {}
  stratTiles: Record<string, GenTile> = {}
  regTiles: Record<string, GenTile> = {}
  gameTiles: Record<string, GenTile> = {}

  private _objStore = useObjectsStore()
  land: TypeObject
  water: TypeObject
  flat: TypeObject
  hill: TypeObject
  terrains: TypeObject[]
  oceans: TypeObject[]
  oceanTerrain: TypeObject
  seaTerrain: TypeObject
  coastTerrain: TypeObject
  lakeTerrain: TypeObject

  private readonly _xTypes: Record<number, TypeKey> = {}
  private readonly _yTypes: Record<number, TypeKey> = {}
  private readonly _yxTypes: Record<number, Record<number, TypeClass | TypeKey>> = {}
  private readonly _climateBands: TypeKey[][] = []

  constructor (size: WorldSize, flipX: boolean = true, flipY: boolean = true, flipClimate: boolean = true) {
    if (size.y % 9 !== 0) throw new Error(
      `World size must be a multiple of 9, got [x${size.x}, y${size.y}]`
    )
    if ((size.y * 2) !== size.x) throw new Error(
      `World size must be a 2:1 rectangle, got [x${size.x}, y${size.y}]`
    )
    this.size = size
    this.stratSize = { x: size.x / 9, y: size.y / 9 }
    this.regSize = { x: size.x / 3, y: size.y / 3 }

    this.land = this._objStore.getTypeObject('domainType:land')
    this.water = this._objStore.getTypeObject('domainType:water')
    this.flat = this._objStore.getTypeObject('elevationType:flat')
    this.hill = this._objStore.getTypeObject('elevationType:hill')

    this.terrains = this._objStore.getClassTypes('terrainType')

    this.oceans = this._objStore.getClassTypes('oceanType')
    this.oceanTerrain = this._objStore.getTypeObject('terrainType:ocean')
    this.seaTerrain = this._objStore.getTypeObject('terrainType:sea')
    this.coastTerrain = this._objStore.getTypeObject('terrainType:coast')
    this.lakeTerrain = this._objStore.getTypeObject('terrainType:lake')

    // Initialize flipped presets according to options
    this._climateBands = getClimateBands(flipClimate)
    this._yTypes = getYTypes(this.stratSize.y, flipY)
    this._xTypes = getXTypes(this.stratSize.x, flipX)
    this._yxTypes = getYXTypes(this.stratSize.x, this.stratSize.y, flipY, flipX)
  }

  // Generate str-level tiles
  generateStratLevel (): TerraGenerator {
    this._stratGeneratePresets()
    this._stratGenerateEmpties()
    this._stratPostProcess()

    return this
  }

  generateRegLevel (): TerraGenerator {
    this._regFillFromStrat()
    this._regPostProcess()

    return this
  }

  private _stratGeneratePresets (): void {
    // Make a copy so we don't mutate the store
    const continents = [...this._objStore.getClassTypes('continentType')]

    // Shuffle x & y values to randomize preset continent order & placement
    const ys = [...Array(this.stratSize.y).keys()]
    const xs = [...Array(this.stratSize.x).keys()]

    for (const y of ys) {
      for (const x of xs) {
        // Get preset type from x/y types
        const type = (this._xTypes[x] ?? this._yTypes[y] ?? (this._yxTypes[y] ?? [])[x] ?? null) as TypeClass | TypeKey | null

        // If no preset type, skip tile
        if (!type) {
          continue
        }

        const key = Tile.getKey(x, y)

        // It's Land
        if (type === 'continentType') {
          // All continents already generated?
          if (Object.values(this.continents).length >= this.size.continents) continue

          const continent = takeRandom(continents)

          // Init continent data
          this.continents[key] = {
            type: continent,
            majorStarts: { strat: [] as GenTile[], reg: [] as GenTile[], game: [] as GenTile[] },
            minorStarts: { strat: [] as GenTile[], reg: [] as GenTile[], game: [] as GenTile[] },
          } as any as ContinentData

          // Add a 3x3 grid of land tiles around the continent center
          const neighborCoords = this._getNeighborCoords(x, y, 'chebyshev', 1, this.stratSize)
          for (const coords of [{ x, y }, ...neighborCoords]) {
            const gridKey = Tile.getKey(coords.x, coords.y)

            const climate = this._getClimateFromStratY(y)

            const tile = new GenTile(
              coords.x,
              coords.y,
              this.land,
              continent,
              climate,
              this._getLandTerrainFromClimate(climate),
              this.flat
            )
            if (coords.x === x && coords.y === y) {
              tile.isContinentCenter = true
              this.continents[key].center = tile
            }
            this.stratTiles[gridKey] = tile
          }

          // Add Major Start locations
          // Add Major start tiles
          const startCoords = [
            { x: x - 1, y: y - 1 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y + 1 },
            { x: x + 1, y: y + 1 },
          ]
          // If it's a small continent, look in more directions
          const backupStartCoords = [
            { x, y: y - 1 },
            { x: x, y: y + 1 },
            { x: x - 1, y },
            { x: x + 1, y },
            { x: x - 2, y },
            { x: x + 2, y },
          ]

          while (
            this.continents[key].majorStarts.strat.length < this.size.majorsPerContinent
            && (startCoords.length > 0 || backupStartCoords.length > 0)
            ) {
            const coords = takeRandom(startCoords.length > 0 ? startCoords : backupStartCoords)

            const startTile = this.stratTiles[Tile.getKey(coords.x, coords.y)]
            if (!startTile?.canBeStart()) continue

            startTile.isStart = 'major'
            this.continents[key].majorStarts.strat.push(
              startTile
            )
          }

          continue
        }

        // It's Water

        // If it's been set as land by a Continent 3x3 grid, skip
        if (this.stratTiles[key]) continue

        // Get the ocean type
        const ocean = this.oceans.find(o => o.key === type)
        if (!ocean) throw new Error(`[terraGenerator] Invalid ocean in x/y types: ${type}`)

        const climate = this._getClimateFromStratY(y)

        this.stratTiles[key] = new GenTile(
          x,
          y,
          this.water,
          ocean,
          climate,
          ['caribbean', 'mediterranean'].includes(ocean.id) ? this.seaTerrain : this.oceanTerrain,
          this.flat
        )
        this.stratTiles[key].isSalt = true

        //Continue to the next X
      }

      // Continue to the next Y
    }
  }

  private _stratGenerateEmpties (): void {
    const emptyCoords = [] as { x: number, y: number }[]
    for (let y = 0; y < this.stratSize.y; y++) {
      for (let x = 0; x < this.stratSize.x; x++) {
        const key = Tile.getKey(x, y)
        if (!this.stratTiles[key]) emptyCoords.push({ x, y })
      }
    }

    while (emptyCoords.length > 0) {
      const randI = Math.floor(Math.random() * emptyCoords.length)
      const { x, y } = emptyCoords[randI]
      const key = Tile.getKey(x, y)

      // If it's actually not empty, skip
      if (this.stratTiles[key]) {
        // Remove from emptyCoords
        emptyCoords.splice(randI, 1)
        continue
      }

      const neighbors = this._getStratNeighbors(x, y)

      // No neighbors yet -> skip
      if (neighbors.length === 0) {
        continue
      }

      // Check vs seaLevel
      // 3: no mods
      // 2: must pick from land neighbors 50% of the time
      // 1: must pick from land neighbors 75% of the time
      const landOnly = this.size.seaLevel === 3 ? false : (
        this.size.seaLevel === 2
          ? Math.random() < 0.25
          : Math.random() < 0.50
      )

      // Pick a random neighbor as the base for this new tile
      const randNeighbors = landOnly ? neighbors.filter(n => n.domain === this.land) : neighbors
      if (!randNeighbors.length) continue

      const rand = getRandom(randNeighbors)

      // It's Land!
      if (rand.domain === this.land) {
        // Copy tile (except climate and terrain from Y)
        const climate = this._getClimateFromStratY(y)
        this.stratTiles[key] = new GenTile(
          x,
          y,
          rand.domain,
          rand.area,
          climate,
          this._getLandTerrainFromClimate(climate),
          rand.elevation
        )

        // Remove from emptyCoords
        emptyCoords.splice(randI, 1)
        continue
      }

      // It's Water!

      // Prefer to spread Sea, or the Atlantic/Indian/Pacific oceans, or other Water
      const preferredOcean = neighbors.find(n => n.terrain === this.seaTerrain)
        || neighbors.find(n => ['oceanType:atlantic', 'oceanType:indian', 'oceanType:pacific'].includes(n.area.id))
        || rand

      const climate = this._getClimateFromStratY(y)
      this.stratTiles[key] = new GenTile(
        x,
        y,
        preferredOcean.domain,
        preferredOcean.area,
        climate,
        preferredOcean.terrain,
        preferredOcean.elevation
      )
      // mark salt water spreading
      this.stratTiles[key].isSalt = preferredOcean.terrain === this.seaTerrain || preferredOcean.terrain === this.oceanTerrain
      this.stratTiles[key].isFresh = false

      // Remove from emptyCoords
      emptyCoords.splice(randI, 1)

      // Go to the next random empty coordinate
    }
  }

  private _stratPostProcess (): void {
    // Remove orphan areas
    for (let y = 0; y < this.stratSize.y; y++) {
      for (let x = 0; x < this.stratSize.x; x++) {
        const key = Tile.getKey(x, y)
        const tile = this.stratTiles[key]
        if (!tile) throw new Error(`stratTile[${key}] does not exist`)

        const neighbors = this._getRegNeighbors(x, y, 'manhattan')
        removeOrphanArea(tile, neighbors)
      }
    }

    // Find big chunks of Land/Water and convert center to Lake/Island
    const potentialLakes = [] as GenTile[]

    // Also on the same pass, add hills on land
    for (let y = 0; y < this.stratSize.y; y++) {
      for (let x = 0; x < this.stratSize.x; x++) {
        const key = Tile.getKey(x, y)
        const tile = this.stratTiles[key]
        const isLand = tile.domain === this.land

        if (isLand) {
          // 25% chance to become a hill
          if (Math.random() < 0.25) tile.elevation = this.hill

          // Check if it can become a Lake
          if (!tile.canBeWater()) continue

          const neighbors = this._getStratNeighbors(x, y, 'manhattan', 2)
          const allAreSameDomain = neighbors.every(n => n.domain === tile.domain)

          // Lakes can grow next to each other
          if (allAreSameDomain) potentialLakes.push(tile)
        } else {
          // Check if Water can become an Island
          if (!tile.canBeLand()) continue

          const neighbors = this._getStratNeighbors(x, y, 'chebyshev', 2)
          const allAreSameDomain = neighbors.every(n => n.domain === tile.domain)

          // 50% chance to become an ocean island (and prevent another island near-by)
          if (allAreSameDomain && Math.random() < 0.5) {
            tile.domain = this.land
            tile.terrain = this._getLandTerrainFromClimate(tile.climate)
            tile.isSalt = false
            tile.isFresh = false
          }
        }
      }
    }

    for (const tile of potentialLakes) {
      // 50% chance to become a lake
      if (Math.random() < 0.5) {
        tile.domain = this.water
        tile.terrain = this.lakeTerrain
        tile.isFresh = true
        tile.isSalt = false
        // NOTE: allow lakes and hills at strategic/region level, fix in game level
        // (allows for lakes surrounded by hills)
      }
    }
  }

  private _regFillFromStrat (): void {
    for (let y = 0; y < this.regSize.y; y++) {
      for (let x = 0; x < this.regSize.x; x++) {
        // Choose a random stratLevel neighbor
        const regNeighborCoords = this._getNeighborCoords(x, y, 'manhattan', 1, this.regSize)
        const stratNeighbors = regNeighborCoords.map(c => this._getStratFromRegCoords(c.x, c.y))
        const strat = getRandom(stratNeighbors)

        // Allow a 25% chance for elevation swap for extra variety
        const elevation = strat.domain === this.land && Math.random() < 0.25
          ? (strat.elevation === this.flat ? this.hill : this.flat)
          : strat.elevation

        const tile = new GenTile(
          x,
          y,
          strat.domain,
          strat.area,
          strat.climate,
          strat.terrain,
          elevation,
        )

        const distToPole = (y === 0 || y === this.regSize.y - 1)
          ? 0
          : (
            (y === 1 || y === this.regSize.y - 2)
              ? 1
              : 2
          )
        tile.feature = this._getFeatureForTile(tile, distToPole) as any
        this.regTiles[Tile.getKey(x, y)] = tile
      }
    }
  }

  private _regPostProcess (): void {
    // Clean orphaned areas
    for (let y = 0; y < this.regSize.y; y++) {
      for (let x = 0; x < this.regSize.x; x++) {
        const key = Tile.getKey(x, y)
        const tile = this.regTiles[key]
        if (!tile) throw new Error(`regTile[${key}] does not exist`)

        const neighbors = this._getRegNeighbors(x, y, 'manhattan')
        removeOrphanArea(tile, neighbors)
      }
    }

    // Find large blobs of Sea: add random tetris-shape of land
    for (let y = 0; y < this.regSize.y; y++) {
      for (let x = 0; x < this.regSize.x; x++) {
        const key = Tile.getKey(x, y)
        const tile = this.regTiles[key]!
        if (tile.terrain !== this.seaTerrain) continue

        const neighbors = this._getRegNeighbors(x, y, 'manhattan', 3)
        const allAreSameTerrain = neighbors.every(n => n.terrain === tile.terrain)

        if (!allAreSameTerrain) continue

        // Generate a small "tetris"-like island in a 2x2 or 3x3 footprint
        const offsets = Tetris.randomOffsets()
        for (const o of offsets) {
          const tt = this._getTile(x + o.dx, y + o.dy, this.regSize, this.regTiles)
          if (!tt) continue
          if (!tt.canChangeDomain()) continue
          tt.domain = this.land
          tt.terrain = this._getLandTerrainFromClimate(tile.climate)
          tt.elevation = this.hill
          tt.isFresh = false
          tt.isSalt = false
        }
      }
    }

    const landTilesPerContinent: Record<string, Record<string, GenTile>> = {}
    for (const tile of Object.values(this.regTiles)) {
      if (tile.domain !== this.land) continue

      if (!landTilesPerContinent[tile.area.key]) {
        landTilesPerContinent[tile.area.key] = {}
      }
      landTilesPerContinent[tile.area.key][tile.key] = tile
    }
    for (const continent of Object.values(this.continents)) {
      // Add starts per continent
      for (const stratStartTile of continent.majorStarts.strat) {
        const startTile = getRandom(
          this._getRegTilesFromStratCoords(stratStartTile.x, stratStartTile.y).filter(t => t.domain === this.land)
        )
        startTile.isStart = 'major'
        continent.majorStarts.reg.push(startTile)

        // Reserved as a start -> remove from landTilesPerContinent
        delete landTilesPerContinent[startTile.area.key][startTile.key]
      }

      // Add 3 mountain ranges per continent
      const landTiles = Object.values(landTilesPerContinent[continent.type.key])
      for (let i = 0; i < 3; i++) {
        const rangeStart = takeRandom(landTiles)
        const mountainTiles = mountainRange(
          rangeStart,
          this.regTiles,
          this.regSize,
        )

        // Flat Mountain neighbors have a 50% chance of becoming hill
        for (const tile of mountainTiles) {
          for (const neighbor of this._getRegNeighbors(tile.x, tile.y, 'manhattan')) {
            // Skip non-lake water
            if (neighbor.domain === this.water && neighbor.terrain !== this.lakeTerrain) continue

            if (neighbor.elevation === this.flat && Math.random() < 0.5) neighbor.elevation = this.hill
          }
        }
      }
    }
  }

  /*
   * Internal helper functions
   */

  private _getClimateFromStratY (y: number): TypeObject {
    const climateBandCount = this._climateBands.length

    // Use the center of the row to reduce boundary artifacts
    const pos = (y + 0.5) / this.stratSize.y // in [0, 1)
    const fIndex = pos * climateBandCount // in [0, C)

    // Compute adjacent band indices and clamp
    let lo = Math.floor(fIndex)
    let hi = Math.ceil(fIndex)
    if (hi >= climateBandCount) hi = climateBandCount - 1
    if (lo < 0) lo = 0

    const options = lo === hi
      ? this._climateBands[lo]
      : [...this._climateBands[lo], ...this._climateBands[hi]]

    const climateKey = getRandom(options)
    const climate = this._objStore
      .getClassTypes('climateType')
      .find(c => c.key === climateKey)

    if (!climate) throw new Error(`[terraGenerator] Invalid climate in climateBands: ${climateKey}`)
    return climate
  }

  private _getFeatureForTile (tile: GenTile, distToPole: number): TypeObject | undefined {
    const rand = Math.random()

    if ((!distToPole && rand < 0.75) || (distToPole === 1 && rand < 0.25)) {
      return this._objStore.getTypeObject('featureType:ice')
    }

    if (tile.climate.key === 'climateType:frozen') {
      if (tile.terrain === this.oceanTerrain) {
        return rand < 0.2 ? this._objStore.getTypeObject('featureType:ice') : undefined
      }
    }

    if (tile.climate.key === 'climateType:cold') {
      if (tile.domain === this.land) {
        return rand < 0.75
          ? (rand < 0.25
              ? this._objStore.getTypeObject('featureType:swamp')
              : this._objStore.getTypeObject('featureType:pineForest')
          ) : undefined
      }

      if (tile.terrain === this.coastTerrain || tile.terrain === this.lakeTerrain) {
        return rand < 0.2 ? this._objStore.getTypeObject('featureType:kelp') : undefined
      }
    }

    if (tile.climate.key === 'climateType:temperate') {
      if (tile.domain === this.land) {
        return rand < 0.5
          ? this._objStore.getTypeObject('featureType:forest')
          : undefined
      }
    }

    if (tile.climate.key === 'climateType:warm') {
      if (tile.domain === this.land) {
        return rand < 0.5
          ? (
            rand < 0.2
              ? this._objStore.getTypeObject('featureType:forest')
              : this._objStore.getTypeObject('featureType:shrubs')
          ) : undefined
      }
    }

    if (tile.climate.key === 'climateType:hot') {
      if (tile.domain === this.land) {
        return rand < 0.25
          ? (rand < 0.1
              ? this._objStore.getTypeObject('featureType:oasis')
              : this._objStore.getTypeObject('featureType:shrubs')
          ) : undefined
      }

      if (tile.terrain === this.oceanTerrain) {
        return rand < 0.1
          ? this._objStore.getTypeObject('featureType:atoll')
          : undefined
      }

      if (tile.terrain === this.coastTerrain || tile.terrain === this.lakeTerrain) {
        return rand < 0.25
          ? this._objStore.getTypeObject('featureType:lagoon')
          : undefined
      }
    }

    if (tile.climate.key === 'climateType:equatorial') {
      if (tile.domain === this.land) {
        return rand < 0.75
          ? this._objStore.getTypeObject('featureType:jungle')
          : undefined
      }

      if (tile.terrain === this.oceanTerrain) {
        return rand < 0.1
          ? this._objStore.getTypeObject('featureType:atoll')
          : undefined
      }

      if (tile.terrain === this.coastTerrain || tile.terrain === this.lakeTerrain) {
        return rand < 0.25
          ? this._objStore.getTypeObject('featureType:lagoon')
          : undefined
      }
    }

    return undefined
  }

  private _getLandTerrainFromClimate (climate: TypeObject): TypeObject {

    const terrainKey = climateTerrain[climate.key]
    const terrain = this.terrains.find(t => t.key === terrainKey)

    if (!terrain) throw new Error(`[terraGenerator] Invalid terrain in climateTerrain: {${climate.key}: ${terrainKey}}`)

    return terrain
  }

  private _getStratFromGameCoords (x: number, y: number): GenTile {
    const key = Tile.getKey(Math.floor(x / 9), Math.floor(y / 9))
    const tile = this.regTiles[key]
    if (!tile) throw new Error(`game[${x}, ${y}] -> regTile[${key}] does not exist`)
    return tile
  }

  private _getStratFromRegCoords (x: number, y: number): GenTile {
    const key = Tile.getKey(Math.floor(x / 3), Math.floor(y / 3))
    const tile = this.stratTiles[key]
    if (!tile) throw new Error(`reg[${x}, ${y}] -> stratTile[${key}] does not exist`)
    return tile
  }

  private _getRegFromGameCoords (x: number, y: number): GenTile {
    const key = Tile.getKey(Math.floor(x / 3), Math.floor(y / 3))
    const tile = this.regTiles[key]
    if (!tile) throw new Error(`game[${x}, ${y}] -> regTile[${key}] does not exist`)
    return tile
  }

  private _getGameTilesFromRegCoords (x: number, y: number): GenTile[] {
    // Return the 3x3 grid of game tiles inside this region tile
    const cx = x * 3 + 1
    const cy = y * 3 + 1
    const center = this.gameTiles[Tile.getKey(cx, cy)]
    const neighbors = this._getGameNeighbors(cx, cy, 'chebyshev', 1)
    return center ? [center, ...neighbors] : neighbors
  }

  private _getGameTilesFromStratCoords (x: number, y: number): GenTile[] {
    // Return the 9x9 grid of game tiles inside this strategic tile
    const cx = x * 9 + 4
    const cy = y * 9 + 4
    const center = this.gameTiles[Tile.getKey(cx, cy)]
    const neighbors = this._getGameNeighbors(cx, cy, 'chebyshev', 4)
    return center ? [center, ...neighbors] : neighbors
  }

  private _getRegTilesFromStratCoords (x: number, y: number): GenTile[] {
    // Return the 3x3 grid of region tiles inside this strategic tile
    const cx = x * 3 + 1
    const cy = y * 3 + 1
    const center = this.regTiles[Tile.getKey(cx, cy)]
    const neighbors = this._getRegNeighbors(cx, cy, 'chebyshev', 1)
    return center ? [center, ...neighbors] : neighbors
  }

  private _getGameNeighbors (
    x: number,
    y: number,
    metric: 'chebyshev' | 'manhattan' = 'chebyshev',
    dist = 1,
  ): GenTile[] {
    const coords = this._getNeighborCoords(x, y, metric, dist, this.size)
    const out: GenTile[] = []
    for (const c of coords) {
      const key = Tile.getKey(c.x, c.y)
      const t = this.gameTiles[key]
      if (t) out.push(t)
    }
    return out
  }

  // Wrap X, clamp Y for provided size and tiles; null when Y is out of bounds.
  // Throws if a valid (wrapped) key is missing from the tiles map.
  private _getTile (
    x: number,
    y: number,
    size: { x: number, y: number },
    tiles: Record<string, GenTile>
  ): GenTile | null {
    if (y < 0 || y >= size.y) return null
    const nx = ((x % size.x) + size.x) % size.x
    const key = Tile.getKey(nx, y)
    const t = tiles[key]
    if (!t) throw new Error(`Tile not found for key ${key} (nx=${nx}, y=${y})`)
    return t
  }

  private _getRegNeighbors (
    x: number,
    y: number,
    metric: 'chebyshev' | 'manhattan' = 'chebyshev',
    dist = 1,
  ): GenTile[] {
    const coords = this._getNeighborCoords(x, y, metric, dist, this.regSize)
    const out: GenTile[] = []
    for (const c of coords) {
      const key = Tile.getKey(c.x, c.y)
      const t = this.regTiles[key]
      if (t) out.push(t)
    }
    return out
  }

  private _getStratNeighbors (
    x: number,
    y: number,
    metric: 'chebyshev' | 'manhattan' = 'chebyshev',
    dist = 1,
  ): GenTile[] {
    const coords = this._getNeighborCoords(x, y, metric, dist, this.stratSize)
    const out: GenTile[] = []
    for (const c of coords) {
      const key = Tile.getKey(c.x, c.y)
      const t = this.stratTiles[key]
      if (t) out.push(t)
    }
    return out
  }

  private _getNeighborCoords (
    x: number,
    y: number,
    metric: 'chebyshev' | 'manhattan' = 'chebyshev',
    dist = 1,
    size: { x: number, y: number }
  ): { x: number, y: number }[] {
    const neighbors: { x: number, y: number }[] = []
    const seen = new Set<string>()

    for (let dy = -dist; dy <= dist; dy++) {
      const ny = y + dy
      // Ignore over/under y-size
      if (ny < 0 || ny >= size.y) continue

      for (let dx = -dist; dx <= dist; dx++) {
        if (metric === 'manhattan' && Math.abs(dx) + Math.abs(dy) > dist) continue

        // Normalize/wrap X without mutating dx
        const nx = ((x + dx) % size.x + size.x) % size.x
        if (nx === x && ny === y) continue

        const key = Tile.getKey(nx, ny)
        if (seen.has(key)) continue

        neighbors.push({ x: nx, y: ny })
        seen.add(key)
      }
    }
    return neighbors
  }
}

/*
 * Map Config
 */

const climateBands = [
  ['climateType:frozen'],
  ['climateType:frozen', 'climateType:cold'],
  ['climateType:cold', 'climateType:temperate'],
  ['climateType:temperate', 'climateType:temperate', 'climateType:warm'],
  ['climateType:temperate', 'climateType:warm'],
  ['climateType:warm', 'climateType:hot', 'climateType:hot'],
  ['climateType:hot'],
  ['climateType:hot', 'climateType:hot', 'climateType:warm'],
  ['climateType:warm', 'climateType:equatorial'],
  ['climateType:equatorial'],
  ['climateType:equatorial', 'climateType:warm'],
  ['climateType:warm', 'climateType:cold'],
  ['climateType:cold', 'climateType:frozen'],
  ['climateType:frozen'],
] as TypeKey[][]

// Wrap climate bands in a function allowing Y flip
function getClimateBands (flipY: boolean): TypeKey[][] {
  return flipY ? [...climateBands].reverse() : climateBands
}

const climateTerrain = {
  'climateType:frozen': 'terrainType:snow',
  'climateType:cold': 'terrainType:tundra',
  'climateType:temperate': 'terrainType:grass',
  'climateType:warm': 'terrainType:plains',
  'climateType:hot': 'terrainType:desert',
  'climateType:equatorial': 'terrainType:grass',
} as Record<TypeKey, TypeKey>

// The top and bottom rows are ocean
const yTypes = {
  0: 'oceanType:arctic',

  13: 'oceanType:antarctic',
} as Record<number, TypeKey>

// Wrap yTypes in a function allowing Y flip
function getYTypes (stratHeight: number, flipY: boolean): Record<number, TypeKey> {
  if (!flipY) return yTypes
  const out: Record<number, TypeKey> = {}
  const max = stratHeight - 1
  for (const [k, v] of Object.entries(yTypes)) {
    const y = Number(k)
    out[max - y] = v
  }
  return out
}

// The left and right columns are ocean; so is the middle
const xTypes = {
  0: 'oceanType:pacific',

  11: 'oceanType:atlantic',
  12: 'oceanType:atlantic',

  27: 'oceanType:pacific',
} as Record<number, TypeKey>

// Wrap xTypes in a function allowing X flip
function getXTypes (stratWidth: number, flipX: boolean): Record<number, TypeKey> {
  if (!flipX) return xTypes
  const out: Record<number, TypeKey> = {}
  const max = stratWidth - 1
  for (const [k, v] of Object.entries(xTypes)) {
    const x = Number(k)
    out[max - x] = v
  }
  return out
}

// Set continents and fine-tune oceans/seas
const yxTypes = {
  1: {
    1: 'oceanType:pacific',

    26: 'oceanType:pacific',
  },
  2: {
    13: 'oceanType:atlantic',
    15: 'continentType',
  },
  3: {
    1: 'oceanType:pacific',

    7: 'continentType',

    19: 'continentType',

    26: 'oceanType:pacific',
  },
  4: {
    3: 'continentType',

    13: 'oceanType:atlantic',
  },
  5: {
    1: 'oceanType:pacific',

    13: 'oceanType:atlantic', // med is attached to atlantic
    14: 'oceanType:mediterranean',
    15: 'oceanType:mediterranean',
    16: 'oceanType:mediterranean',
    17: 'oceanType:mediterranean',
    18: 'oceanType:mediterranean',
    19: 'oceanType:mediterranean',

    24: 'continentType',
    26: 'oceanType:pacific',
  },
  6: {
    13: 'oceanType:atlantic',
  },
  7: {
    1: 'oceanType:pacific',

    4: 'oceanType:caribbean',
    5: 'oceanType:caribbean',
    6: 'oceanType:caribbean',
    7: 'oceanType:caribbean',
    8: 'oceanType:caribbean',
    9: 'oceanType:caribbean',
    10: 'oceanType:atlantic', // carib is attached to atlantic

    26: 'oceanType:pacific',
  },
  8: {
    13: 'oceanType:atlantic',

    20: 'continentType',
  },
  9: {
    1: 'oceanType:pacific',

    4: 'continentType',

    16: 'continentType',

    26: 'oceanType:pacific',
  },
  10: {
    8: 'continentType',

    13: 'oceanType:atlantic',

    18: 'oceanType:indian',
    19: 'oceanType:indian',
    20: 'oceanType:indian',
    21: 'oceanType:indian',
  },
  11: {
    1: 'oceanType:pacific',

    18: 'oceanType:indian',
    19: 'oceanType:indian',
    20: 'oceanType:indian',
    21: 'oceanType:indian',

    24: 'continentType',
    26: 'oceanType:pacific',
  },
  12: {
    13: 'oceanType:atlantic',

    18: 'oceanType:indian',
    19: 'oceanType:indian',
    20: 'oceanType:indian',
    21: 'oceanType:indian',
  },
} as Record<number, Record<number, TypeClass | TypeKey>>

// Wrap yxTypes in a function allowing X/Y flips
function getYXTypes (
  stratWidth: number,
  stratHeight: number,
  flipY: boolean,
  flipX: boolean,
): Record<number, Record<number, TypeClass | TypeKey>> {
  if (!flipY && !flipX) return yxTypes
  const out: Record<number, Record<number, TypeClass | TypeKey>> = {}
  const maxY = stratHeight - 1
  const maxX = stratWidth - 1
  for (const [yStr, row] of Object.entries(yxTypes)) {
    const y = Number(yStr)
    const ny = flipY ? maxY - y : y
    out[ny] = out[ny] ?? {}
    for (const [xStr, v] of Object.entries(row)) {
      const x = Number(xStr)
      const nx = flipX ? maxX - x : x
      out[ny][nx] = v
    }
  }
  return out
}
