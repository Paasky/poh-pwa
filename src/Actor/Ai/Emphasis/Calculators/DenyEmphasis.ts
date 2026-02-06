import { CategoryEmphasis, EmphasisReason } from "@/Actor/Ai/AiTypes";
import { CommonEmphasis } from "@/Actor/Ai/Emphasis/Calculators/_CommonEmphasis";

export class DenyEmphasis extends CommonEmphasis {
  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Enemy Agenda
    const enemyAgendaValue = this.getEnemyAgendaValue();
    if (enemyAgendaValue > 0) {
      reasons.push({
        type: "enemyAgenda",
        value: enemyAgendaValue,
      });
    }

    // Enemy Value Tiles
    const enemyValueTilesValue = this.getEnemyValueTilesValue();
    if (enemyValueTilesValue > 0) {
      reasons.push({
        type: "enemyValueTile",
        value: enemyValueTilesValue,
      });
    }

    // Chokepoints
    const chokepointValue = this.getChokepointValue();
    if (chokepointValue > 0) {
      reasons.push({
        type: "chokepoint",
        value: chokepointValue,
      });
    }

    return this.buildResult("deny", reasons);
  }

  private getEnemyAgendaValue(): number {
    let enemyAgendaCount = 0;

    for (const tile of this.locality.tiles) {
      for (const agenda of tile.agendas.values()) {
        if (agenda.playerKey !== this.player.key) {
          enemyAgendaCount++;
        }
      }
    }

    return Math.min(100, enemyAgendaCount * 25);
  }

  private getEnemyValueTilesValue(): number {
    let enemyValueTiles = 0;

    for (const tile of this.locality.tiles) {
      if (tile.playerKey && tile.playerKey !== this.player.key) {
        if (tile.resource || tile.construction) {
          enemyValueTiles++;
        }
      }
    }

    return Math.min(100, enemyValueTiles * 20);
  }

  private getChokepointValue(): number {
    let totalChokepointValue = 0;
    let tileCount = 0;

    for (const tile of this.locality.tiles) {
      if (tile.chokepointValue > 0) {
        totalChokepointValue += tile.chokepointValue;
        tileCount++;
      }
    }

    if (tileCount === 0) return 0;

    const avgChokepointValue = totalChokepointValue / tileCount;
    return Math.min(100, Math.round(avgChokepointValue));
  }
}
