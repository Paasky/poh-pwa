import { Player } from "@/Common/Models/Player";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { PohMutation } from "@/Common/PohMutation";

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
      throw new Error("Actor is not in crisis");
    }
    return this;
  }

  handleAction(): PohMutation[] {
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
