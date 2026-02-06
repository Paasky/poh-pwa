import { CategoryEmphasis, EmphasisReason, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class RiskEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

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
    const tensionValue = this.getTensionValue();
    if (tensionValue > 0) {
      reasons.push({
        type: "tension",
        value: tensionValue,
      });
    }

    const value =
      reasons.length > 0 ? reasons.reduce((sum, r) => sum + r.value, 0) / reasons.length : 0;

    return {
      category: "risk",
      value: Math.round(value),
      reasons,
    };
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

  private getTensionValue(): number {
    const tension = this.locality.tension;
    if (!tension) return 0;

    switch (tension) {
      case "safe":
        return 0;
      case "calm":
        return 25;
      case "suspicious":
        return 50;
      case "violence":
        return 100;
      default:
        throw new Error(`Unknown tension type: ${tension}`);
    }
  }
}
