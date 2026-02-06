import { CategoryEmphasis, EmphasisReason } from "@/Actor/Ai/AiTypes";
import { CommonEmphasis } from "@/Actor/Ai/Emphasis/Calculators/_CommonEmphasis";

export class UrgencyEmphasis extends CommonEmphasis {
  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Tension
    const tensionValue = this.getTensionValue(this.locality.tension);
    if (tensionValue > 0) {
      reasons.push({
        type: "tension",
        value: tensionValue,
      });
    }

    // Siege
    // <=50 tile.city?.health: 100, 100 health: 0
    const siegeValue = this.getSiegeValue();
    if (siegeValue > 0) {
      reasons.push({
        type: "siege",
        value: siegeValue,
      });
    }

    // Diplomacy Timers
    // TODO: Not implemented yet

    return this.buildResult("urgency", reasons);
  }
}
