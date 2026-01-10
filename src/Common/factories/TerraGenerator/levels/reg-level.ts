import { TerraGenerator } from "@/Common/factories/TerraGenerator/terra-generator";
import { Tile } from "@/Common/Models/Tile";
import {
  makeIsland,
  mountainRange,
  removeOrphanArea,
} from "@/Common/factories/TerraGenerator/helpers/post-processors";
import { GenTile } from "@/Common/factories/TerraGenerator/gen-tile";
import { getNeighborCoords } from "@/Common/Helpers/mapTools";

export class RegLevel {
  gen: TerraGenerator;

  constructor(gen: TerraGenerator) {
    this.gen = gen;
  }

  fillFromStrat(): RegLevel {
    for (let y = 0; y < this.gen.regSize.y; y++) {
      for (let x = 0; x < this.gen.regSize.x; x++) {
        let stratTile = this.gen.getStratFromRegCoords(x, y);

        // If the parent stratTile is not a start, allow for variety from neighbors
        if (!stratTile.isStart) {
          // Choose a random stratLevel neighbor
          const neighbors = getNeighborCoords(this.gen.regSize, { x, y }, "manhattan", 1);
          stratTile = this.gen.rng.pick(
            neighbors.map((n) => this.gen.getStratFromRegCoords(n.x, n.y)),
          )!;
        }

        const elevation = stratTile.domain.id === "land" ? stratTile.elevation : this.gen.flat;

        const tile = new GenTile(
          GenTile.getKey(x, y),
          x,
          y,
          stratTile.domain,
          stratTile.area,
          stratTile.climate,
          stratTile.terrain,
          elevation,
        );

        // Set terrain based on distance from pole (allow for polar ice)
        const distToPole = this.gen.getDistToPole(y, this.gen.regSize.y);
        tile.feature = this.gen.getFeatureForTile(tile, distToPole);
        this.gen.regTiles[Tile.getKey(x, y)] = tile;
      }
    }

    return this;
  }

  postProcess(): RegLevel {
    this.removeOrphans().addIslands().processContinents();

    return this;
  }

  private removeOrphans(): RegLevel {
    this.gen.forEachRegTile((tile) =>
      removeOrphanArea(tile, this.gen.getRegNeighbors(tile, "manhattan"), this.gen.rng),
    );

    return this;
  }

  private addIslands(): RegLevel {
    this.gen.forEachRegTile((tile) => {
      // Check 50% on Sea, 1% on Ocean (there's a lot of Ocean)
      if (tile.terrain === this.gen.seaTerrain && this.gen.rng.chance(0.5)) return;
      if (tile.terrain === this.gen.oceanTerrain && this.gen.rng.chance(0.99)) return;

      const neighbors = this.gen.getRegNeighbors(tile, "manhattan", 3);
      const allAreSameTerrain = neighbors.every((n) => n.terrain === tile.terrain);
      if (allAreSameTerrain) {
        makeIsland(this.gen, tile, "reg", 0.75);
      }
    });

    return this;
  }

  private processContinents(): RegLevel {
    // Group land tiles per continent
    const landTilesPerContinent: Record<string, Record<string, GenTile>> = {};
    for (const tile of Object.values(this.gen.regTiles)) {
      if (tile.domain === this.gen.land) {
        if (!landTilesPerContinent[tile.area.key]) {
          landTilesPerContinent[tile.area.key] = {};
        }
        landTilesPerContinent[tile.area.key][tile.key] = tile;
      }
    }

    for (const continent of Object.values(this.gen.continents)) {
      // Add starts per continent
      for (const stratStartTile of continent.majorStarts.strat) {
        const startTile = this.gen.rng.pick(
          this.gen
            .getRegTilesFromStratCoords(stratStartTile.x, stratStartTile.y)
            .filter((t) => t.canBeStart()),
        )!;
        startTile.isStart = "major";
        continent.majorStarts.reg.push(startTile);

        // Reserved as a start -> remove from landTilesPerContinent
        delete landTilesPerContinent[startTile.area.key][startTile.key];
      }

      // Add 5 mountain ranges per continent
      const landTiles = Object.values(landTilesPerContinent[continent.type.key]);
      for (let i = 0; i < 5; i++) {
        const rangeStart = this.gen.rng.take(landTiles)!;
        const mountainTiles = mountainRange(
          rangeStart,
          this.gen.regTiles,
          this.gen.regSize,
          this.gen.rng,
        );

        // Flat Mountain neighbors have a 50% chance of becoming hill
        for (const tile of mountainTiles) {
          for (const neighbor of this.gen.getRegNeighbors(tile, "manhattan")) {
            // Skip non-lake water
            if (neighbor.domain === this.gen.water && neighbor.terrain !== this.gen.lakeTerrain)
              continue;

            if (neighbor.elevation === this.gen.flat && this.gen.rng.chance(0.5))
              neighbor.elevation = this.gen.hill;
          }
        }
      }
    }

    return this;
  }
}
