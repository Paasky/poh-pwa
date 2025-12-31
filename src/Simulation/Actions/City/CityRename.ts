import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { IMutation } from "@/Common/IMutation";
import { belongsToPlayer } from "@/Simulation/Validator";

export class CityRename implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly name: string,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.city);

    if (!this.name) throw new Error("City name cannot be empty");

    if (this.city.name === this.name)
      throw new Error("City name cannot be the same as the current one");

    if (this.player.cities.some((c) => c.name === this.name))
      throw new Error("City name already exists");

    return this;
  }

  handleAction(): IMutation[] {
    return [
      {
        type: "update",
        payload: { key: this.city.key, name: this.name },
      },
    ];
  }
}
