import { CategoryEmphasis, EmphasisReason, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class RewardEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Unknown Tiles
    const unknownTilesValue = this.getUnknownTilesValue();
    if (unknownTilesValue > 0) {
      reasons.push({
        type: "unknownTile",
        value: unknownTilesValue,
      });
    }

    // Our Agenda
    // TODO: Not implemented yet

    // Wonders Available
    // TODO: Not implemented yet

    const value =
      reasons.length > 0 ? reasons.reduce((sum, r) => sum + r.value, 0) / reasons.length : 0;

    return {
      category: "reward",
      value: Math.round(value),
      reasons,
    };
  }

  private getUnknownTilesValue(): number {
    let unknownTiles = 0;
    let totalTiles = 0;

    for (const tile of this.locality.tiles) {
      totalTiles++;
      if (!this.player.knownTileKeys.has(tile.key)) {
        unknownTiles++;
      }
    }

    if (totalTiles === 0) return 0;

    const ratio = unknownTiles / totalTiles;
    return Math.round(ratio * 100);
  }
}
