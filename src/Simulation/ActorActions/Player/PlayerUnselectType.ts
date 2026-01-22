import { Player } from "@/Common/Models/Player";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { PohMutation } from "@/Common/PohMutation";

export class PlayerUnselectType implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly type: TypeObject,
  ) {}

  validateAction(): this {
    switch (this.type.class) {
      case "traitType":
        if (!this.player.culture.traits.has(this.type)) {
          throw new Error("This trait is not selected by this player");
        }
        break;
      default:
        throw new Error(`Invalid type class ${this.type.class}`);
    }
    return this;
  }

  handleAction(): PohMutation[] {
    return [
      {
        type: "action",
        action: "unselectType",
        payload: {
          key: this.player.key,
          type: this.type.key,
        },
      },
    ];
  }
}
