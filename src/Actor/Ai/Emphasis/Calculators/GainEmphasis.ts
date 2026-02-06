import { CategoryEmphasis, EmphasisReason, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class GainEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Unused Resources
    const unusedResourceValue = this.getUnusedResourceValue();
    if (unusedResourceValue > 0) {
      reasons.push({
        type: "unusedResource",
        value: unusedResourceValue,
      });
    }

    // Unimproved Land
    const unimprovedLandValue = this.getUnimprovedLandValue();
    if (unimprovedLandValue > 0) {
      reasons.push({
        type: "unimprovedLand",
        value: unimprovedLandValue,
      });
    }

    // Good Settlement Tiles
    // TODO: Not implemented yet

    const value =
      reasons.length > 0 ? reasons.reduce((sum, r) => sum + r.value, 0) / reasons.length : 0;

    return {
      category: "gain",
      value: Math.round(value),
      reasons,
    };
  }

  private getUnusedResourceValue(): number {
    let unusedResourceCount = 0;

    for (const tile of this.locality.tiles) {
      if (tile.resource && !tile.construction && tile.playerKey === this.player.key) {
        unusedResourceCount++;
      }
    }

    return Math.min(100, unusedResourceCount * 25);
  }

  private getUnimprovedLandValue(): number {
    let unimprovedCount = 0;
    let totalOurTiles = 0;

    for (const tile of this.locality.tiles) {
      if (tile.playerKey === this.player.key) {
        totalOurTiles++;
        if (!tile.construction && tile.domain.id === "land") {
          unimprovedCount++;
        }
      }
    }

    if (totalOurTiles === 0) return 0;

    const ratio = unimprovedCount / totalOurTiles;
    return Math.round(ratio * 100);
  }
}
