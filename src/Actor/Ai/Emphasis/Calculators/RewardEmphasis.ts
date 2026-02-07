import { CategoryEmphasis, EmphasisReason } from "@/Actor/Ai/AiTypes";
import { CommonEmphasis } from "@/Actor/Ai/Emphasis/Calculators/_CommonEmphasis";

export class RewardEmphasis extends CommonEmphasis {
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
    const ourAgendaValue = this.getOurAgendaValue();
    if (ourAgendaValue > 0) {
      reasons.push({
        type: "agendaTarget",
        value: ourAgendaValue,
      });
    }

    // Wonders Available
    const wondersValue = this.getWondersAvailableValue();
    if (wondersValue > 0) {
      reasons.push({
        type: "wonderAvailable",
        value: wondersValue,
      });
    }

    return this.buildResult("reward", reasons);
  }

  private getOurAgendaValue(): number {
    let ourAgendaCount = 0;

    for (const tile of this.locality.tiles) {
      for (const agenda of tile.agendas.values()) {
        if (agenda.playerKey === this.player.key) {
          ourAgendaCount++;
        }
      }
    }

    return Math.min(100, ourAgendaCount * 25);
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

  private getWondersAvailableValue(): number {
    const totalAvailable =
      this.player.availableWorldWonders.size + this.player.availableNationalWonders.size;

    if (totalAvailable === 0) return 0;

    let buildableTileCount = 0;
    for (const tile of this.locality.tiles) {
      if (!tile.city || tile.city.playerKey !== this.player.key) continue;

      const availableHere = tile.city.getAvailableWondersForTile(tile.key);
      if (availableHere.size > 0) {
        buildableTileCount++;
      }
    }

    if (buildableTileCount === 0) return 0;

    const tileRatio = buildableTileCount / this.locality.tiles.size;
    const wonderBonus = Math.min(totalAvailable, 5);
    return Math.min(100, Math.round(tileRatio * wonderBonus * 20));
  }
}
