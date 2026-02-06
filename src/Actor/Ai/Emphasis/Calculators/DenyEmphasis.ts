import { CategoryEmphasis, EmphasisReason, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class DenyEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Enemy Agenda
    // TODO: Not implemented yet

    // Enemy Value Tiles
    const enemyValueTilesValue = this.getEnemyValueTilesValue();
    if (enemyValueTilesValue > 0) {
      reasons.push({
        type: "enemyValueTile",
        value: enemyValueTilesValue,
      });
    }

    // Chokepoints
    // TODO: Not implemented yet

    const value =
      reasons.length > 0 ? reasons.reduce((sum, r) => sum + r.value, 0) / reasons.length : 0;

    return {
      category: "deny",
      value: Math.round(value),
      reasons,
    };
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
}
