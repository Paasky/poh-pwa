import { Difficulty, Locality, MilitaryAction, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { IAnalysisMindset } from "@/Actor/Ai/Mindsets/_IAnalysisMindset";
import { Memory } from "@/Actor/Ai/Memory";

export class PreSettled implements IAnalysisMindset {
  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly memory: Memory,
    public readonly regions: Set<Region>,
  ) {}

  analyzeLocality(locality: Locality): Note[] {
    let militaryAction: MilitaryAction = "reduce";

    // If any tile has an unknown neighbor, recommend militaryAction: Explore
    for (const tile of locality.tiles) {
      for (const neighbor of tile.neighborTiles) {
        if (!this.player.knownTileKeys.has(neighbor.key)) {
          militaryAction = "explore";
        }
      }
    }

    return [
      {
        name: locality.name,
        militaryAction,
      },
    ];
  }

  analyzeRegion(region: Region): Note[] {
    const notes = [] as Note[];
    region.localities.forEach((locality) => {
      notes.push(...this.analyzeLocality(locality));
    });

    // todo: analyze Region

    return [];
  }

  analyzeStrategy(memory: Memory): Priority[] {
    const notes = [] as Note[];
    this.regions.forEach((region) => {
      notes.push(...this.analyzeRegion(region));
    });

    // todo analyze Global Strategy

    return [];
  }
}
