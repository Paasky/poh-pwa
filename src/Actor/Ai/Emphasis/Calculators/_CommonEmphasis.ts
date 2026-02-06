import { CategoryEmphasis, EmphasisReason, Locality, Tension } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export abstract class CommonEmphasis {
  constructor(
    protected readonly player: Player,
    protected readonly locality: Locality,
  ) {}

  abstract calculate(): CategoryEmphasis;

  protected buildResult(
    category: CategoryEmphasis["category"],
    reasons: EmphasisReason[],
  ): CategoryEmphasis {
    const value =
      reasons.length > 0 ? reasons.reduce((sum, r) => sum + r.value, 0) / reasons.length : 0;

    return {
      category,
      value: Math.round(value),
      reasons,
    };
  }

  protected getTensionValue(tension?: Tension): number {
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

  // Convert ratio to value: 0: <= 1:2, 50: 1:1, 100: >= 2:1
  protected ratioToValue(ours: number, theirs: number): number {
    if (ours === 0) return 0;
    if (theirs === 0) return 100;

    const ratio = ours / theirs;

    // ratio <= 0.5 -> 0
    // ratio = 1.0 -> 50
    // ratio >= 2.0 -> 100
    if (ratio <= 0.5) return 0;
    if (ratio >= 2.0) return 100;

    // Linear interpolation between 0.5 and 2.0
    if (ratio <= 1.0) {
      // 0.5 to 1.0 maps to 0 to 50
      return ((ratio - 0.5) / 0.5) * 50;
    } else {
      // 1.0 to 2.0 maps to 50 to 100
      return 50 + ((ratio - 1.0) / 1.0) * 50;
    }
  }

  protected getSiegeValue(): number {
    for (const tile of this.locality.tiles) {
      if (tile.city && tile.city.playerKey === this.player.key) {
        const health = tile.city.health;
        // <=50 health: 100, 100 health: 0
        if (health <= 50) return 100;
        return Math.round(((100 - health) / 50) * 100);
      }
    }
    return 0;
  }
}
