import { CategoryEmphasis, EmphasisReason, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class UrgencyEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Tension
    const tensionValue = this.getTensionValue();
    if (tensionValue > 0) {
      reasons.push({
        type: "tension",
        value: tensionValue,
      });
    }

    // Siege
    // TODO: Not implemented yet

    // Diplomacy Timers
    // TODO: Not implemented yet

    const value =
      reasons.length > 0 ? reasons.reduce((sum, r) => sum + r.value, 0) / reasons.length : 0;

    return {
      category: "urgency",
      value: Math.round(value),
      reasons,
    };
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
