import { CategoryEmphasis, EmphasisReason } from "@/Actor/Ai/AiTypes";
import { CommonEmphasis } from "@/Actor/Ai/Emphasis/Calculators/_CommonEmphasis";

export class GainEmphasis extends CommonEmphasis {
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
    const goodSettleValue = this.getGoodSettleTilesValue();
    if (goodSettleValue > 0) {
      reasons.push({
        type: "goodSettleTile",
        value: goodSettleValue,
      });
    }

    return this.buildResult("gain", reasons);
  }

  private getGoodSettleTilesValue(): number {
    let totalSettleValue = 0;
    let tileCount = 0;

    for (const tile of this.locality.tiles) {
      if (!tile.playerKey && tile.settleValue > 0) {
        totalSettleValue += tile.settleValue;
        tileCount++;
      }
    }

    if (tileCount === 0) return 0;

    const avgSettleValue = totalSettleValue / tileCount;
    return Math.min(100, Math.round(avgSettleValue));
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
