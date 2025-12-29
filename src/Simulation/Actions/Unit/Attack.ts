import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { isValidCombatTarget } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";
import { Tile } from "@/objects/game/Tile";
import { City } from "@/objects/game/City";

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
