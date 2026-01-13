import { TypeKey } from "@/Common/Objects/World";
import { TypeClass, TypeObject } from "@/Common/Objects/TypeObject";
import { WorldSize } from "@/Common/factories/worldFactory";
import { useDataBucket } from "@/Data/useDataBucket";
import { Rng } from "@/Common/Helpers/Rng";
import { StratLevel } from "./levels/strat-level";
import { RegLevel } from "./levels/reg-level";
import { GameLevel } from "./levels/game-level";
import { GenTile } from "@/Common/factories/TerraGenerator/gen-tile";
import { Coords, getNeighbors, getRealCoords, NeighborMethod } from "@/Common/Helpers/mapTools";
import {
  climateTerrain,
  ContinentData,
  getClimateBands,
  getXTypes,
  getYTypes,
  getYXTypes,
} from "@/Common/factories/TerraGenerator/config";
import { Tile } from "@/Common/Models/Tile";
import { River } from "@/Common/Models/River";

export class TerraGenerator {
  size: WorldSize;
  regSize: { x: number; y: number };
  stratSize: { x: number; y: number };
  private rng: Rng;

  continents: Record<string, ContinentData> = {};
  stratTiles: Record<string, GenTile> = {};
  regTiles: Record<string, GenTile> = {};
  gameTiles: Record<string, GenTile> = {};
  rivers: Record<string, River> = {};

  bucket = useDataBucket();
  land: TypeObject;
  water: TypeObject;
  flat: TypeObject;
  hill: TypeObject;
  mountain: TypeObject;
  terrains: TypeObject[];
  oceans: TypeObject[];
  oceanTerrain: TypeObject;
  seaTerrain: TypeObject;
  coastTerrain: TypeObject;
  lakeTerrain: TypeObject;

  readonly xTypes: Record<number, TypeKey> = {};
  readonly yTypes: Record<number, TypeKey> = {};
  readonly yxTypes: Record<number, Record<number, TypeClass | TypeKey>> = {};
  readonly climateBands: TypeKey[][] = [];

  constructor(
    size: WorldSize,
    seed?: string | number,
    flipX: boolean = true,
    flipY: boolean = true,
    flipClimate: boolean = true,
  ) {
    if (size.y % 9 !== 0)
      throw new Error(`World size must be a multiple of 9, got [x${size.x}, y${size.y}]`);
    if (size.y * 2 !== size.x)
      throw new Error(`World size must be a 2:1 rectangle, got [x${size.x}, y${size.y}]`);
    this.size = size;
    this.rng = seed ? new Rng(seed) : rng;
    this.stratSize = { x: size.x / 9, y: size.y / 9 };
    this.regSize = { x: size.x / 3, y: size.y / 3 };

    this.land = this.bucket.getType("domainType:land");
    this.water = this.bucket.getType("domainType:water");
    this.flat = this.bucket.getType("elevationType:flat");
    this.hill = this.bucket.getType("elevationType:hill");
    this.mountain = this.bucket.getType("elevationType:mountain");

    this.terrains = Array.from(this.bucket.getClassTypes("terrainType"));

    this.oceans = Array.from(this.bucket.getClassTypes("oceanType"));
    this.oceanTerrain = this.bucket.getType("terrainType:ocean");
    this.seaTerrain = this.bucket.getType("terrainType:sea");
    this.coastTerrain = this.bucket.getType("terrainType:coast");
    this.lakeTerrain = this.bucket.getType("terrainType:lake");

    // Initialize flipped presets according to options
    this.climateBands = getClimateBands(flipClimate);
    this.yTypes = getYTypes(this.stratSize.y, flipY);
    this.xTypes = getXTypes(this.stratSize.x, flipX);
    this.yxTypes = getYXTypes(this.stratSize.x, this.stratSize.y, flipY, flipX);
  }

  // Generate str-level tiles
  generateStratLevel(): TerraGenerator {
    new StratLevel(this).generatePresets().generateEmpties().postProcess();

    return this;
  }

  generateRegLevel(): TerraGenerator {
    new RegLevel(this).fillFromStrat().postProcess();

    return this;
  }

  generateGameLevel(): TerraGenerator {
    new GameLevel(this).fillFromReg().postProcess();

    return this;
  }

  /*
   * Internal helper functions
   */

  getClimateFromStratY(y: number): TypeObject {
    const climateBandCount = this.climateBands.length;

    // Use the center of the row to reduce boundary artifacts
    const pos = (y + 0.5) / this.stratSize.y; // in [0, 1)
    const fIndex = pos * climateBandCount; // in [0, C)

    // Compute adjacent band indices and clamp
    let lo = Math.floor(fIndex);
    let hi = Math.ceil(fIndex);
    if (hi >= climateBandCount) hi = climateBandCount - 1;
    if (lo < 0) lo = 0;

    const options =
      lo === hi ? this.climateBands[lo] : [...this.climateBands[lo], ...this.climateBands[hi]];

    const climateKey = this.rng.pick(options)!;
    const climate = Array.from(this.bucket.getClassTypes("climateType")).find(
      (c) => c.key === climateKey,
    );

    if (!climate)
      throw new Error(`[terraGenerator] Invalid climate in climateBands: ${climateKey}`);
    return climate;
  }

  getDistToPole(y: number, ySize: number): number {
    // Return 0 if on the top/bottom row, else distance to the closest pole (top/bottom)
    // Guard against invalid sizes
    if (ySize <= 0) return 0;

    const maxIndex = ySize - 1;
    // Clamp y to valid range [0, maxIndex]
    const yy = Math.max(0, Math.min(y, maxIndex));

    // Distance to nearest edge (pole)
    return Math.min(yy, maxIndex - yy);
  }

  // Distance to the equator band
  // - If ySize is odd, equator is the single middle row
  // - If ySize is even, equator is the two middle rows
  // Returns 0 if y is on the equator row(s), else the Manhattan distance in rows
  getDistToEquator(y: number, ySize: number): number {
    if (ySize <= 0) return 0;

    const maxIndex = ySize - 1;
    const yy = Math.max(0, Math.min(y, maxIndex));

    if (ySize % 2 === 1) {
      // Single middle row
      const equator = (ySize - 1) / 2;
      return Math.abs(yy - equator);
    } else {
      // Two middle rows: ySize/2 - 1 and ySize/2
      const lower = ySize / 2 - 1;
      const upper = ySize / 2;
      return Math.min(Math.abs(yy - lower), Math.abs(yy - upper));
    }
  }

  getFeatureForTile(tile: GenTile, distToPole: number): TypeObject | null {
    const rand = this.rng.next();

    if ((!distToPole && rand < 0.75) || (distToPole === 1 && rand < 0.25)) {
      return this.bucket.getType("featureType:ice");
    }

    if (tile.climate.key === "climateType:frozen") {
      if (tile.terrain === this.oceanTerrain) {
        return rand < 0.2 ? this.bucket.getType("featureType:ice") : null;
      }
    }

    if (tile.climate.key === "climateType:cold") {
      if (tile.domain === this.land) {
        return rand < 0.75
          ? rand < 0.25
            ? this.bucket.getType("featureType:swamp")
            : this.bucket.getType("featureType:pineForest")
          : null;
      }

      if (tile.terrain === this.coastTerrain || tile.terrain === this.lakeTerrain) {
        return rand < 0.2 ? this.bucket.getType("featureType:kelp") : null;
      }
    }

    if (tile.climate.key === "climateType:temperate") {
      if (tile.domain === this.land) {
        return rand < 0.5 ? this.bucket.getType("featureType:forest") : null;
      }
    }

    if (tile.climate.key === "climateType:warm") {
      if (tile.domain === this.land) {
        return rand < 0.5
          ? rand < 0.2
            ? this.bucket.getType("featureType:forest")
            : this.bucket.getType("featureType:shrubs")
          : null;
      }
    }

    if (tile.climate.key === "climateType:hot") {
      if (tile.domain === this.land) {
        return rand < 0.25
          ? rand < 0.1
            ? this.bucket.getType("featureType:oasis")
            : this.bucket.getType("featureType:shrubs")
          : null;
      }

      if (tile.terrain === this.oceanTerrain) {
        return rand < 0.1 ? this.bucket.getType("featureType:atoll") : null;
      }

      if (tile.terrain === this.coastTerrain || tile.terrain === this.lakeTerrain) {
        return rand < 0.25 ? this.bucket.getType("featureType:lagoon") : null;
      }
    }

    if (tile.climate.key === "climateType:equatorial") {
      if (tile.domain === this.land) {
        return rand < 0.75 ? this.bucket.getType("featureType:jungle") : null;
      }

      if (tile.terrain === this.oceanTerrain) {
        return rand < 0.1 ? this.bucket.getType("featureType:atoll") : null;
      }

      if (tile.terrain === this.coastTerrain || tile.terrain === this.lakeTerrain) {
        return rand < 0.25 ? this.bucket.getType("featureType:lagoon") : null;
      }
    }

    return null;
  }

  getLandTerrainFromClimate(climate: TypeObject): TypeObject {
    const terrainKey = climateTerrain[climate.key];
    const terrain = this.terrains.find((t) => t.key === terrainKey);

    if (!terrain)
      throw new Error(
        `[terraGenerator] Invalid terrain in climateTerrain: {${climate.key}: ${terrainKey}}`,
      );

    return terrain;
  }

  getStratFromGameCoords(x: number, y: number): GenTile {
    const key = Tile.getKey(Math.floor(x / 9), Math.floor(y / 9));
    const tile = this.regTiles[key];
    if (!tile) throw new Error(`game[${x}, ${y}] -> regTile[${key}] does not exist`);
    return tile;
  }

  getStratFromRegCoords(x: number, y: number): GenTile {
    const key = Tile.getKey(Math.floor(x / 3), Math.floor(y / 3));
    const tile = this.stratTiles[key];
    if (!tile) throw new Error(`reg[${x}, ${y}] -> stratTile[${key}] does not exist`);
    return tile;
  }

  getRegFromGameCoords(x: number, y: number): GenTile {
    const key = Tile.getKey(Math.floor(x / 3), Math.floor(y / 3));
    const tile = this.regTiles[key];
    if (!tile) throw new Error(`game[${x}, ${y}] -> regTile[${key}] does not exist`);
    return tile;
  }

  getGameTilesFromRegCoords(x: number, y: number): GenTile[] {
    // Return the 3x3 grid of game tiles inside this region tile
    const cx = x * 3 + 1;
    const cy = y * 3 + 1;
    const center = this.gameTiles[Tile.getKey(cx, cy)];
    const neighbors = this.getGameNeighbors({ x: cx, y: cy });
    return center ? [center, ...neighbors] : neighbors;
  }

  getGameTilesFromStratCoords(x: number, y: number): GenTile[] {
    // Return the 9x9 grid of game tiles inside this strategic tile
    const cx = x * 9 + 4;
    const cy = y * 9 + 4;
    const center = this.gameTiles[Tile.getKey(cx, cy)];
    const neighbors = this.getGameNeighbors({ x: cx, y: cy }, 4);
    return center ? [center, ...neighbors] : neighbors;
  }

  getRegTilesFromStratCoords(x: number, y: number): GenTile[] {
    // Return the 3x3 grid of region tiles inside this strategic tile
    const cx = x * 3 + 1;
    const cy = y * 3 + 1;
    const center = this.regTiles[Tile.getKey(cx, cy)];
    const neighbors = this.getRegNeighbors({ x: cx, y: cy });
    return center ? [center, ...neighbors] : neighbors;
  }

  getGameNeighbors(coords: Coords, dist = 1): GenTile[] {
    return getNeighbors(this.size, coords, this.gameTiles, "hex", dist);
  }

  getRegNeighbors(coords: Coords, method: NeighborMethod = "chebyshev", dist = 1): GenTile[] {
    return getNeighbors(this.regSize, coords, this.regTiles, method, dist);
  }

  getStratNeighbors(coords: Coords, method: NeighborMethod = "chebyshev", dist = 1): GenTile[] {
    return getNeighbors(this.stratSize, coords, this.stratTiles, method, dist);
  }

  getTile(size: Coords, coords: Coords, tiles: Record<string, GenTile>): GenTile | null {
    const realCoords = getRealCoords(size, coords);
    const t = realCoords ? tiles[Tile.getKey(realCoords.x, realCoords.y)] : undefined;
    return t || null;
  }

  forEachGameTile(cb: (tile: GenTile) => void) {
    Object.values(this.gameTiles).forEach(cb);
  }

  forEachRegTile(cb: (tile: GenTile) => void) {
    Object.values(this.regTiles).forEach(cb);
  }

  forEachStratTile(cb: (tile: GenTile) => void) {
    Object.values(this.stratTiles).forEach(cb);
  }
}
