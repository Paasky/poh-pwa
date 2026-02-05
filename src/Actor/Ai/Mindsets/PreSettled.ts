import {
  CategoryEmphasis,
  Difficulty,
  EmphasisCategory,
  Priority,
  Region,
} from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { IMindset } from "@/Actor/Ai/Mindsets/_IMindset";
import { Memory } from "@/Actor/Ai/Memory";
import { regionEmphasis } from "@/Actor/Ai/Emphasis/RegionEmphasis";
import { PohEvent } from "@/Common/PohEvent";

// Player doesn't have any cities yet, just Exploring
export class PreSettled implements IMindset {
  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly memory: Memory,
    public readonly regions: Set<Region>,
  ) {}

  analyzeStrategy(events: PohEvent[]): Priority[] {
    let bestRegion: Region | undefined;
    let bestEmphasis: Map<EmphasisCategory, CategoryEmphasis> | undefined;
    let bestScore = -Infinity;

    for (const region of this.regions) {
      const regionalEmphasis = regionEmphasis(this.player, region);

      // Region Score = Gain + Reward - Risk
      const score =
        regionalEmphasis.get("gain")!.value +
        regionalEmphasis.get("reward")!.value -
        regionalEmphasis.get("risk")!.value;

      if (score > bestScore) {
        bestScore = score;
        bestRegion = region;
        bestEmphasis = regionalEmphasis;
      }
    }

    // Should be impossible, but keeps TS happy
    if (!bestRegion || !bestEmphasis) {
      throw new Error("PreSettled.analyzeStrategy(): failed to select best region");
    }

    return [];
  }
}
