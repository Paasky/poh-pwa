import { Unit } from "@/Common/Models/Unit";
import { PohMutation } from "@/Common/PohMutation";
import { roundToTenth } from "@/Common/Objects/World";
import { clamp } from "@/Common/Helpers/basicMath";
import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";

export class Health {
  constructor(public readonly object: City | Construction | Unit) {}

  getChangeNextTurn(): number {
    const baseHeal =
      this.object instanceof Construction ? (this.object.citizenKeys.size ? 10 : -10) : 19;

    const damageAndHeal = this.object.yields.flatten(
      new Set(["yieldType:damage", "yieldType:heal"]),
      this.object.types,
      this.object.types,
    );

    const change = roundToTenth(
      baseHeal +
        damageAndHeal.getLumpAmount("yieldType:heal") -
        damageAndHeal.getLumpAmount("yieldType:damage"),
    );

    return clamp(
      change,
      // Cannot lose more health than the object has
      -this.object.health,
      // Can gain up to 100 health
      100 - this.object.health,
    );
  }

  modify(amount: number): PohMutation | null {
    const newHealth = roundToTenth(clamp(this.object.health + amount, 0, 100));
    if (newHealth === this.object.health) {
      return null;
    }

    this.object.health = newHealth;

    if (this.object.health <= 0) {
      return {
        type: "remove",
        payload: {
          key: this.object.key,
        },
      };
    }

    return {
      type: "update",
      payload: {
        key: this.object.key,
        health: this.object.health,
      },
    };
  }
}
