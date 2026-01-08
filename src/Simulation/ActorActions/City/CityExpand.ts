import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { City } from "@/Common/Models/City";
import { IMutation } from "@/Common/IMutation";
import { Tile } from "@/Common/Models/Tile";
import { Player } from "@/Common/Models/Player";

export class CityExpand implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly tile: Tile,
    private readonly isPurchase = false,
  ) {}

  validateAction(): this {
    return this;
  }

  handleAction(): IMutation[] {
    return [];
  }
}
