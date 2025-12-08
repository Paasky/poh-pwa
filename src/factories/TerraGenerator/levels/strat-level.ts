import { TerraGenerator } from "@/factories/TerraGenerator/terra-generator";
import { TypeClass } from "@/types/typeObjects";
import { TypeKey } from "@/types/common";
import { Tile } from "@/objects/game/Tile";
import { getRandom, takeRandom } from "@/helpers/arrayTools";
import { removeOrphanArea } from "@/factories/TerraGenerator/helpers/post-processors";
import { GenTile } from "@/factories/TerraGenerator/gen-tile";
import { ContinentData } from "@/factories/TerraGenerator/config";
import { getNeighborCoords } from "@/helpers/mapTools";

export class StratLevel {
  gen: TerraGenerator;

  constructor(gen: TerraGenerator) {
    this.gen = gen;
  }

  generatePresets(): StratLevel {
    // Make a copy so we don't mutate the store
    const continents = [...this.gen.objStore.getClassTypes("continentType")];

    // Shuffle x & y values to randomize preset continent order & placement
    const ys = [...Array(this.gen.stratSize.y).keys()];
    const xs = [...Array(this.gen.stratSize.x).keys()];

    for (const y of ys) {
      for (const x of xs) {
        // Get preset type from x/y types: 1. arctic/antarctic, 2. atlantic/pacific, 3. specific
        const type = (this.gen.yTypes[y] ??
          this.gen.xTypes[x] ??
          (this.gen.yxTypes[y] ?? [])[x] ??
          null) as TypeClass | TypeKey | null;

        // If no preset type, skip tile
        if (!type) {
          continue;
        }

        const key = Tile.getKey(x, y);

        // It's Land
        if (type === "continentType") {
          // All continents already generated?
          if (Object.values(this.gen.continents).length >= this.gen.size.continents) continue;

          const continent = takeRandom(continents);

          // Init continent data
          this.gen.continents[continent.key] = {
            type: continent,
            majorStarts: {
              strat: [] as GenTile[],
              reg: [] as GenTile[],
              game: [] as GenTile[],
            },
            minorStarts: {
              strat: [] as GenTile[],
              reg: [] as GenTile[],
              game: [] as GenTile[],
            },
          } as ContinentData;

          // Add a 3x3 grid of land tiles around the continent center
          const neighborCoords = getNeighborCoords(this.gen.stratSize, { x, y }, "chebyshev", 1);
          for (const coords of [{ x, y }, ...neighborCoords]) {
            const gridKey = Tile.getKey(coords.x, coords.y);

            const climate = this.gen.getClimateFromStratY(y);

            const tile = new GenTile(
              GenTile.getKey(x, y),
              coords.x,
              coords.y,
              this.gen.land,
              continent,
              climate,
              this.gen.getLandTerrainFromClimate(climate),
              this.gen.flat,
            );
            if (coords.x === x && coords.y === y) {
              tile.isContinentCenter = true;
              this.gen.continents[continent.key].center = tile;
            }
            this.gen.stratTiles[gridKey] = tile;
          }

          // Add Major Start locations
          // Add Major start tiles
          const startCoords = [
            { x: x - 1, y: y - 1 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y + 1 },
            { x: x + 1, y: y + 1 },
          ];
          // If it's a small continent, look in more directions
          const backupStartCoords = [
            { x, y: y - 1 },
            { x: x, y: y + 1 },
            { x: x - 1, y },
            { x: x + 1, y },
            { x: x - 2, y },
            { x: x + 2, y },
          ];

          while (
            this.gen.continents[continent.key].majorStarts.strat.length <
              this.gen.size.majorsPerContinent &&
            (startCoords.length > 0 || backupStartCoords.length > 0)
          ) {
            const coords = takeRandom(startCoords.length > 0 ? startCoords : backupStartCoords);

            const startTile = this.gen.stratTiles[Tile.getKey(coords.x, coords.y)];
            if (!startTile?.canBeStart()) continue;

            startTile.isStart = "major";
            this.gen.continents[continent.key].majorStarts.strat.push(startTile);
          }

          continue;
        }

        // It's Water

        // If it's been set as land by a Continent 3x3 grid, skip
        if (this.gen.stratTiles[key]) continue;

        // Get the ocean type
        const ocean = this.gen.oceans.find((o) => o.key === type);
        if (!ocean) throw new Error(`[terraGenerator] Invalid ocean in x/y types: ${type}`);

        const climate = this.gen.getClimateFromStratY(y);

        this.gen.stratTiles[key] = new GenTile(
          GenTile.getKey(x, y),
          x,
          y,
          this.gen.water,
          ocean,
          climate,
          ["caribbean", "mediterranean"].includes(ocean.id)
            ? this.gen.seaTerrain
            : this.gen.oceanTerrain,
          this.gen.flat,
        );
        this.gen.stratTiles[key].isSalt = true;

        //Continue to the next X
      }

      // Continue to the next Y
    }

    return this;
  }

  generateEmpties(): StratLevel {
    const emptyCoords = [] as { x: number; y: number }[];
    for (let y = 0; y < this.gen.stratSize.y; y++) {
      for (let x = 0; x < this.gen.stratSize.x; x++) {
        const key = Tile.getKey(x, y);
        if (!this.gen.stratTiles[key]) emptyCoords.push({ x, y });
      }
    }

    while (emptyCoords.length > 0) {
      const randI = Math.floor(Math.random() * emptyCoords.length);
      const { x, y } = emptyCoords[randI];
      const key = Tile.getKey(x, y);

      // If it's actually not empty, skip
      if (this.gen.stratTiles[key]) {
        // Remove from emptyCoords
        emptyCoords.splice(randI, 1);
        continue;
      }

      const neighbors = this.gen.getStratNeighbors({ x, y });

      // No neighbors yet -> skip
      if (neighbors.length === 0) {
        continue;
      }

      // Slightly increase chance of new land
      const landOnly = Math.random() < 0.25;

      // Pick a random neighbor as the base for this new tile
      const randNeighbors = landOnly
        ? neighbors.filter((n) => n.domain === this.gen.land)
        : neighbors;
      if (!randNeighbors.length) continue;

      const rand = getRandom(randNeighbors);

      // It's Land!
      if (rand.domain === this.gen.land) {
        // Copy tile (except climate and terrain from Y)
        const climate = this.gen.getClimateFromStratY(y);
        this.gen.stratTiles[key] = new GenTile(
          GenTile.getKey(x, y),
          x,
          y,
          rand.domain,
          rand.area,
          climate,
          this.gen.getLandTerrainFromClimate(climate),
          rand.elevation,
        );

        // Remove from emptyCoords
        emptyCoords.splice(randI, 1);
        continue;
      }

      // It's Water!

      // Prefer to spread Sea, or the Atlantic/Indian/Pacific oceans, or other Water
      const preferredOcean =
        neighbors.find((n) => n.terrain === this.gen.seaTerrain) ||
        neighbors.find((n) =>
          ["oceanType:atlantic", "oceanType:indian", "oceanType:pacific"].includes(n.area.id),
        ) ||
        rand;

      const climate = this.gen.getClimateFromStratY(y);
      this.gen.stratTiles[key] = new GenTile(
        GenTile.getKey(x, y),
        x,
        y,
        preferredOcean.domain,
        preferredOcean.area,
        climate,
        preferredOcean.terrain,
        preferredOcean.elevation,
      );
      // mark salt water spreading
      this.gen.stratTiles[key].isSalt =
        preferredOcean.terrain === this.gen.seaTerrain ||
        preferredOcean.terrain === this.gen.oceanTerrain;
      this.gen.stratTiles[key].isFresh = false;

      // Remove from emptyCoords
      emptyCoords.splice(randI, 1);

      // Go to the next random empty coordinate
    }

    return this;
  }

  postProcess(): StratLevel {
    // Remove orphan areas
    for (let y = 0; y < this.gen.stratSize.y; y++) {
      for (let x = 0; x < this.gen.stratSize.x; x++) {
        const key = Tile.getKey(x, y);
        const tile = this.gen.stratTiles[key];
        if (!tile) throw new Error(`stratTile[${key}] does not exist`);

        const neighbors = this.gen.getRegNeighbors({ x, y }, "manhattan");
        removeOrphanArea(tile, neighbors);
      }
    }

    // Find big chunks of Land/Water and convert center to Lake/Island
    const potentialLakes = [] as GenTile[];

    // Also on the same pass, add hills on land
    for (let y = 0; y < this.gen.stratSize.y; y++) {
      for (let x = 0; x < this.gen.stratSize.x; x++) {
        const key = Tile.getKey(x, y);
        const tile = this.gen.stratTiles[key];
        const isLand = tile.domain === this.gen.land;

        if (isLand) {
          // 5% chance to become a hill
          if (Math.random() < 0) tile.elevation = this.gen.hill;

          // Check if it can become a Lake
          if (!tile.canBeWater()) continue;

          const neighbors = this.gen.getStratNeighbors({ x, y }, "manhattan", 2);
          const allAreSameDomain = neighbors.every((n) => n.domain === tile.domain);

          // Lakes can grow next to each other
          if (allAreSameDomain) potentialLakes.push(tile);
        } else {
          // Check if Water can become an Island
          if (!tile.canBeLand()) continue;

          const neighbors = this.gen.getStratNeighbors({ x, y }, "chebyshev", 2);
          const allAreSameDomain = neighbors.every((n) => n.domain === tile.domain);

          // 50% chance to become an ocean island (and prevent another island near-by)
          if (allAreSameDomain && Math.random() < 0.5) {
            tile.domain = this.gen.land;
            tile.terrain = this.gen.getLandTerrainFromClimate(tile.climate);
            tile.isSalt = false;
            tile.isFresh = false;
          }
        }
      }
    }

    for (const tile of potentialLakes) {
      // 50% chance to become a lake
      if (Math.random() < 0.5) {
        tile.domain = this.gen.water;
        tile.terrain = this.gen.lakeTerrain;
        tile.isFresh = true;
        tile.isSalt = false;
        // NOTE: allow lakes and hills at strategic/region level, fix in game level
        // (allows for lakes surrounded by hills)
      }
    }

    return this;
  }
}
