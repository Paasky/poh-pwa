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
    const status = this.player.culture.status;

    // This mindset is only valid for pre-settlement phases
    if (status === "settled") {
      throw new Error("PreSettled mindset invalid for settled cultures");
    }

    // Score all regions and filter based on status
    const scoredRegions = this.scoreRegions();

    // Generate priorities based on culture status
    if (status === "notSettled") {
      return this.generateExplorationPriorities(scoredRegions);
    } else {
      // canSettle or mustSettle
      return this.generateSettlementPriorities(scoredRegions);
    }
  }

  /**
   * Scores all regions using the formula: gain + reward - risk
   * Returns regions sorted by score (descending)
   */
  private scoreRegions(): Array<{
    region: Region;
    score: number;
    emphasis: Map<EmphasisCategory, CategoryEmphasis>;
  }> {
    const scored = [];

    for (const region of this.regions) {
      const emphasis = regionEmphasis(this.player, region);

      // Calculate strategic value: gain + reward - risk
      const gain = emphasis.get("gain")?.value ?? 0;
      const reward = emphasis.get("reward")?.value ?? 0;
      const risk = emphasis.get("risk")?.value ?? 0;
      const score = gain + reward - risk;

      scored.push({ region, score, emphasis });
    }

    // Sort descending by score
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * For notSettled status: explore regions with unknown tiles
   * Filter out regions with no exploration value (no unknown tiles)
   * Return top 3 as exploration priorities
   */
  private generateExplorationPriorities(
    scoredRegions: Array<{
      region: Region;
      score: number;
      emphasis: Map<EmphasisCategory, CategoryEmphasis>;
    }>,
  ): Priority[] {
    // Filter regions that have unknown tiles (reward > 0 indicates unknownTile presence)
    const explorableRegions = scoredRegions.filter((r) => {
      const rewardEmphasis = r.emphasis.get("reward");
      if (!rewardEmphasis) return false;

      // Check if any reason is unknownTile with value > 0
      return rewardEmphasis.reasons.some(
        (reason) => reason.type === "unknownTile" && reason.value > 0,
      );
    });

    // Return top 3 exploration priorities
    return explorableRegions.slice(0, 3).map((r, index) => ({
      name: `Explore ${r.region.name}`,
      importance: Math.max(1, Math.min(5, 5 - index)) as 1 | 2 | 3 | 4 | 5,
      emphases: Array.from(r.emphasis.values()),
      mapAction: "explore" as const,
      areaId: r.region.id,
    }));
  }

  /**
   * For canSettle/mustSettle status: settle best region + explore others
   * Return 1 settlement priority + top 3 exploration priorities
   */
  private generateSettlementPriorities(
    scoredRegions: Array<{
      region: Region;
      score: number;
      emphasis: Map<EmphasisCategory, CategoryEmphasis>;
    }>,
  ): Priority[] {
    const priorities: Priority[] = [];

    if (scoredRegions.length === 0) {
      return priorities;
    }

    // Best region for settlement (score by gain - risk, ignoring reward since we're settling not exploring)
    const settlementScored = scoredRegions
      .map((r) => ({
        ...r,
        settleScore: (r.emphasis.get("gain")?.value ?? 0) - (r.emphasis.get("risk")?.value ?? 0),
      }))
      .sort((a, b) => b.settleScore - a.settleScore);

    const bestSettlement = settlementScored[0];

    // Add settlement priority
    priorities.push({
      name: `Settle in ${bestSettlement.region.name}`,
      importance: this.player.culture.status === "mustSettle" ? 5 : 4,
      emphases: Array.from(bestSettlement.emphasis.values()),
      mapAction: "settle",
      areaId: bestSettlement.region.id,
    });

    // Add exploration priorities for other regions
    const explorationRegions = scoredRegions
      .filter((r) => {
        // Exclude the settlement region
        if (r.region.id === bestSettlement.region.id) return false;

        // Only include regions with unknown tiles
        const rewardEmphasis = r.emphasis.get("reward");
        if (!rewardEmphasis) return false;
        return rewardEmphasis.reasons.some(
          (reason) => reason.type === "unknownTile" && reason.value > 0,
        );
      })
      .slice(0, 3);

    explorationRegions.forEach((r, index) => {
      priorities.push({
        name: `Explore ${r.region.name}`,
        importance: Math.max(1, Math.min(3, 3 - index)) as 1 | 2 | 3,
        emphases: Array.from(r.emphasis.values()),
        mapAction: "explore",
        areaId: r.region.id,
      });
    });

    return priorities;
  }
}
