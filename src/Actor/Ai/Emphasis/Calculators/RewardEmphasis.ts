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
    // TODO: Not implemented yet

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
}
