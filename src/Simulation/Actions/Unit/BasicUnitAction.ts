import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ActionType } from "@/Common/IAction";
import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { belongsToPlayer } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class BasicUnitAction implements ISimAction {
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
