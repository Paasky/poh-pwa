import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { ActionType } from "@/Common/IAction";
import { IActionHandler } from "@/Simulation/IActionHandler";
import { belongsToPlayer } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class BasicUnitAction implements IActionHandler {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly actionType: ActionType,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = {
      type: this.actionType,
      target: null,
    };
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
