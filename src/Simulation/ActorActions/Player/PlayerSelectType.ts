import { Player } from "@/Common/Models/Player";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { IMutation } from "@/Common/IMutation";

export class PlayerSelectType implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly type: TypeObject,
  ) {}

  validateAction(): this {
    switch (this.type.class) {
      case "mythType":
        if (!this.player.religion?.selectableMyths.has(this.type)) {
          throw new Error("This myth is not selectable by this player");
        }
        break;
      case "godType":
        if (!this.player.religion?.selectableGods.has(this.type)) {
          throw new Error("This god is not selectable by this player");
        }
        break;
      case "dogmaType":
        if (!this.player.religion?.selectableDogmas.has(this.type)) {
          throw new Error("This dogma is not selectable by this player");
        }
        break;
      case "heritageType":
        if (!this.player.culture.selectableHeritages.has(this.type)) {
          throw new Error("This heritage is not selectable by this player");
        }
        break;
      case "traitType":
        if (!this.player.culture.selectableTraits.has(this.type)) {
          throw new Error("This trait is not selectable by this player");
        }
        break;
      case "technologyType":
        if (this.player.research.researched.has(this.type)) {
          throw new Error("This technology is already researched");
        }
        break;
      default:
        throw new Error(`Invalid type class ${this.type.class}`);
    }
    return this;
  }

  handleAction(): IMutation[] {
    return [
      {
        type: "action",
        action: "selectType",
        payload: {
          key: this.player.key,
          type: this.type.key,
        },
      },
    ];
  }
}
