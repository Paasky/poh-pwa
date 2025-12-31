import { Player } from "@/Common/Models/Player";
import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { IMutation } from "@/Common/IMutation";

export class PlayerActionCrisis implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly actionType:
      | "actionType:enactReforms"
      | "actionType:joinRevolution"
      | "actionType:keepStatusQuo",
  ) {}

  validateAction(): this {
    if (this.player.government.corruption + this.player.government.discontent < 200) {
      throw new Error("Player is not in crisis");
    }
    return this;
  }

  handleAction(): IMutation[] {
    return [
      {
        type: "action",
        action: "actionCrisis",
        payload: {
          key: this.player.key,
          type: this.actionType,
        },
      },
    ];
  }
}
