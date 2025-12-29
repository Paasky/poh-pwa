import { TerraGenerator } from "@/factories/TerraGenerator/terra-generator";
import { getRandom, shuffle } from "@/helpers/arrayTools";
import { GenTile } from "@/factories/TerraGenerator/gen-tile";
import { GameKey } from "@/Common/Models/_GameModel";
import {
  makeIsland,
  makeRiver,
  removeOrphanArea,
  removeOrphanTerrain,
  spreadSalt,
} from "@/factories/TerraGenerator/helpers/post-processors";
import { getNeighborCoords } from "@/helpers/mapTools";
import { TypeKey } from "@/Common/Objects/Common";
import { River } from "@/Common/Models/River";

export class GameLevel {
  gen: TerraGenerator;

  constructor(gen: TerraGenerator) {
    this.gen = gen;
  }

  fillFromReg(): GameLevel {
    for (let y = 0; y < this.gen.size.y; y++) {
      for (let x = 0; x < this.gen.size.x; x++) {
        // Choose a random regLevel neighbor
        const neighborCoords = getNeighborCoords(this.gen.size, { x, y }, "hex", 1);
        const regNeighbors = neighborCoords.map((c) => this.gen.getRegFromGameCoords(c.x, c.y));
        const regTile = getRandom(regNeighbors);

        const elevChance = Math.random();
        const elevation =
          regTile.domain.id === this.gen.water.id
            ? // Water tiles are always flat
              this.gen.flat
            : // 50% chance of flat, 20% chance for elevation swap for extra variety
              elevChance < 0.5
              ? this.gen.flat
              : elevChance < 0.7
                ? regTile.elevation === this.gen.flat
                  ? this.gen.hill
                  : this.gen.flat
                : regTile.elevation;

        const tile = new GenTile(
          GenTile.getKey(x, y),
          x,
          y,
          regTile.domain,
          regTile.area,
          regTile.climate,
          regTile.terrain,
          elevation,
        );

        // Oasis and Atoll are handled in postProcessPass1()
        const setFeatureLater =
          regTile.feature.value?.id === "oasis" || regTile.feature.value?.id == "atoll";
        if (!setFeatureLater) {
          // Allow a 25% chance for feature swap for extra variety
          tile.feature =
            Math.random() < 0.25
              ? regTile.feature.value
                ? // Had a feature -> swap to empty
                  null
                : // Didn't have a feature -> add one
                  this.gen.getFeatureForTile(tile, this.gen.getDistToPole(y, this.gen.size.y))
              : // No feature swap -> use existing feature
                regTile.feature;
        }

        this.gen.gameTiles[tile.key] = tile;
      }
    }

    return this;
  }

  postProcess(): GameLevel {
    this.postProcessPass1()
      .spreadSalt()
      .setSaltFreshEffects()
      .setSeaBetweenCoastAndOcean()
      .addRivers()
      .fixInvalidTiles();

    return this;
  }

  private postProcessPass1(): GameLevel {
    this.gen.forEachGameTile((tile) => {
      const neighbors = this.gen.getGameNeighbors(tile);

      removeOrphanArea(tile, neighbors);
      removeOrphanTerrain(tile, neighbors);

      if (tile.elevation.id === "mountain") {
        // If it's a mountain, make 50% of flat neighbors into hills
        neighbors
          .filter((n) => n.elevation.id === "flat")
          .forEach((n) => (Math.random() < 0.5 ? (n.elevation = this.gen.hill) : null));
      }
      if (tile.elevation.id === "snowMountain") {
        // If it's a snow mountain, make 50%/50% of flat/hill neighbors into hills/mountains
        neighbors
          .filter((n) => n.elevation.id === "flat" || n.elevation.id === "hill")
          .forEach((n) =>
            Math.random() < 0.5 ? (n.elevation = this.gen.hill) : (n.elevation = this.gen.mountain),
          );
      }

      // If on center of regTile
      if (tile.x % 3 === 1 && tile.y % 3 === 1) {
        const regTile = this.gen.getRegFromGameCoords(tile.x, tile.y);

        // Add Starts
        if (regTile.isStart) {
          const startTile = getRandom(neighbors.filter((n) => n.canBeStart()));
          startTile.isStart = regTile.isStart;
          startTile.elevation = this.gen.flat;
          this.gen.continents[startTile.area.key].majorStarts.game.push(startTile);
        }

        // Region is an oasis: add to a random game tile in the 3x3 group
        if (regTile.feature.value?.key === "featureType:oasis") {
          getRandom(neighbors).feature = regTile.feature;
          return;
        }

        // Region is an atoll: add to a random game tile in the 3x3 group
        if (regTile.feature.value?.key === "featureType:atoll") {
          if (Math.random() < 0.5) {
            // Center flat island
            tile.domain = this.gen.land;
            tile.terrain = this.gen.getLandTerrainFromClimate(tile.climate);
            tile.elevation = this.gen.flat;
          } else {
            // Tetris-shaped island, prefer hills
            makeIsland(this.gen, tile, "game", 0.75);
          }
          return;
        }
      }

      // If on sea/lake, 1/10 chance to check for island generation
      if (
        (tile.terrain === this.gen.seaTerrain || tile.terrain === this.gen.lakeTerrain) &&
        Math.random() < 0.1
      ) {
        // Has a 3-size plus-shape area of sea/lake
        const area = this.gen.getGameNeighbors(tile, 3);
        if (area.every((t) => t.terrain === tile.terrain)) {
          if (tile.terrain === this.gen.seaTerrain) {
            // Prefer hill islands in seas
            makeIsland(this.gen, tile, "game", 0.75);
            return;
          } else {
            // Prefer flat islands in lakes
            makeIsland(this.gen, tile, "game", 0.25);
            return;
          }
        }
      }
    });

    return this;
  }

  private spreadSalt(): GameLevel {
    // Spread salt from all edge tiles (some may be land, most will be ocean)
    for (let x = 0; x < this.gen.size.x; x++) {
      for (let y = 0; y < this.gen.size.y; y++) {
        if (x === 0 || y === 0 || x === this.gen.size.x - 1 || y === this.gen.size.y - 1) {
          const start = this.gen.gameTiles[GenTile.getKey(0, 0)]!;
          if (start.domain !== this.gen.water) continue;

          // Already salt, skip
          if (start.isSalt) continue;

          spreadSalt(this.gen, start);
        }
      }
    }
    return this;
  }

  private setSaltFreshEffects(): GameLevel {
    // Normalize Water #1
    //    - Non-salt water becomes Lake (not connected to any Ocean)
    //    - Salt water next to land becomes Coast
    this.gen.forEachGameTile((tile) => {
      if (tile.domain.id !== "water" && tile.feature.value?.id !== "oasis") return;

      // Include quick water elevation sanity check
      if (tile.elevation.id !== this.gen.flat.id) tile.elevation = this.gen.flat;

      const neighbors = this.gen.getGameNeighbors(tile);

      if (tile.isSalt) {
        // Fix any weirdness with salt/fresh: salt wins
        if (tile.isFresh) tile.isFresh = false;

        if (neighbors.some((n) => n.domain === this.gen.land)) {
          tile.terrain = this.gen.coastTerrain;
        }
      } else {
        // tile is water/oasis

        // Fresh water becomes lake
        if (tile.domain.id === "water") {
          tile.terrain = this.gen.lakeTerrain;
        }
        tile.isFresh = true;

        // Mark all neighbors as fresh, since they're next to fresh water
        neighbors.forEach((n) => (n.isFresh = true));
      }
    });

    return this;
  }

  private setSeaBetweenCoastAndOcean(): GameLevel {
    this.gen.forEachGameTile((tile) => {
      if (tile.terrain.id !== this.gen.oceanTerrain.id) return;

      const neighbors = this.gen.getGameNeighbors(tile);
      if (neighbors.some((n) => n.terrain.id === this.gen.coastTerrain.id)) {
        tile.terrain = this.gen.seaTerrain;
      }
    });

    return this;
  }

  private addRivers(): GameLevel {
    // Collect candidate land tiles per continent
    const candidatesPerContinent: Record<TypeKey, GenTile[]> = {};
    for (const t of Object.values(this.gen.gameTiles)) {
      // Quick checks: Land, same continent, not a mountain, 3 grids from salt
      if (t.domain.key !== this.gen.land.key) continue;
      if (t.elevation.id === "mountain") continue;
      if (t.elevation.id === "snowMountain") continue;
      if (this.gen.getGameNeighbors(t, 3).some((nn) => nn.isSalt)) continue;

      if (!candidatesPerContinent[t.area.key]) candidatesPerContinent[t.area.key] = [];

      candidatesPerContinent[t.area.key].push(t);
    }

    const rivers = {} as Record<GameKey, River>;

    for (const continent of Object.values(this.gen.continents)) {
      const candidates = shuffle(candidatesPerContinent[continent.type.key]);
      let riverCount = 0;
      while (riverCount < this.gen.size.y / 12 && candidates.length > 0) {
        const candidate = candidates.pop()!;

        // Check it's still valid (far enough from other rivers)
        if (this.gen.getGameNeighbors(candidate, 3).every((nn) => !nn.riverKey)) {
          const river = makeRiver(this.gen.size, candidate, this.gen.gameTiles, rivers);
          riverCount++;
          rivers[river.key] = river;
        }
      }
    }

    this.gen.rivers = rivers;

    return this;
  }

  private fixInvalidTiles(): GameLevel {
    for (const tile of Object.values(this.gen.gameTiles)) {
      // Fix invalid instancers
      if (tile.feature.value) {
        if (tile.elevation.id === "mountain" || tile.elevation.id === "snowMountain") {
          // Mountains cannot have instancers
          tile.feature = null;
        } else if (tile.elevation.id === "hill") {
          // Hills cannot have flat instancers
          const flatFeatures = ["oasis", "floodPlain", "swamp"];
          if (flatFeatures.includes(tile.feature.id)) {
            tile.feature = null;
          }
        } else if (tile.terrain.id === "ocean" && !["tradeWind", "ice"].includes(tile.feature.id)) {
          // Ocean can ony have trade wind/ice
          tile.feature = null;
        } else {
          const waterFeatures = ["ice", "kelp", "lagoon", "atoll", "tradeWind"];
          if (tile.domain.id === "water") {
            // Water can only have water instancers
            if (!waterFeatures.includes(tile.feature.id)) {
              tile.feature = null;
            }
          } else {
            // Land can only have land instancers
            if (waterFeatures.includes(tile.feature.id)) {
              tile.feature = null;
            }
          }
        }
      }
    }

    return this;
  }
}
