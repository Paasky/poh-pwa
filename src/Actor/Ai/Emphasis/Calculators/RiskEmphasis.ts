import { CategoryEmphasis, EmphasisReason } from "@/Actor/Ai/AiTypes";
import { CommonEmphasis } from "@/Actor/Ai/Emphasis/Calculators/_CommonEmphasis";

export class RiskEmphasis extends CommonEmphasis {
  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Enemy Military
    const enemyMilitaryValue = this.getEnemyMilitaryValue();
    if (enemyMilitaryValue > 0) {
      reasons.push({
        type: "enemyMilitary",
        value: enemyMilitaryValue,
      });
    }

    // Our Value Tiles
    const ourValueTilesValue = this.getOurValueTilesValue();
    if (ourValueTilesValue > 0) {
      reasons.push({
        type: "ourValueTile",
        value: ourValueTilesValue,
      });
    }

    // Tension
    const tensionValue = this.getTensionValue(this.locality.tension);
    if (tensionValue > 0) {
      reasons.push({
        type: "tension",
        value: tensionValue,
      });
    }

    return this.buildResult("risk", reasons);
  }

  private getEnemyMilitaryValue(): number {
    let enemyMilitaryCount = 0;

    for (const tile of this.locality.tiles) {
      for (const unit of tile.units.values()) {
        if (unit.isMilitary && unit.playerKey !== this.player.key) {
          enemyMilitaryCount++;
        }
      }
    }

    return Math.min(100, enemyMilitaryCount * 15);
  }

  private getOurValueTilesValue(): number {
    let ourValueTiles = 0;

    for (const tile of this.locality.tiles) {
      if (tile.playerKey === this.player.key) {
        if (tile.resource || tile.construction) {
          ourValueTiles++;
        }
      }
    }

    return Math.min(100, ourValueTiles * 15);
  }
}
