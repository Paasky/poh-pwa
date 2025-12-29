import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { isValidCombatTarget } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";
import { Tile } from "@/Common/Models/Tile";
import { City } from "@/Common/Models/City";

export class Attack implements IActionHandler {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly target: City | Tile | Unit,
  ) {}

  validateAction(): this {
    isValidCombatTarget(this.unit, this.target);
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = { type: "attack", target: this.target.key };
    return [
      {
        type: "update",
        payload: {
          key: this.unit.key,
          action: this.unit.action,
        },
      },
    ];
  }
}
