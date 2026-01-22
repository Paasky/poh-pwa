import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { PohMutation } from "@/Common/PohMutation";
import { belongsToPlayer } from "@/Simulation/Validator";
import { UnitDesign } from "@/Common/Models/UnitDesign";

export class CityStartTraining implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly design: UnitDesign,
    private readonly index = 0,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.city);
    belongsToPlayer(this.player, this.design);
    if (!this.design.isActive) throw new Error("Unit design is not active");

    return this;
  }

  handleAction(): PohMutation[] {
    return [
      {
        type: "update",
        payload: {
          key: this.city.key,
          constructionQueue: { design: this.design, index: this.index },
        },
      },
    ];
  }
}
