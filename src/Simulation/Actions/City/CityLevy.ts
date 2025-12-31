import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { IMutation } from "@/Common/IMutation";
import { Citizen } from "@/Common/Models/Citizen";
import { belongsToCity, belongsToPlayer } from "@/Simulation/Validator";
import { CreateUnit } from "@/Simulation/CreateMutations/CreateUnit";
import { getRandom } from "@/helpers/arrayTools";

export class CityLevy implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly citizen: Citizen,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.city);
    belongsToCity(this.city, this.citizen);
    if (
      !this.player.activeDesigns.some((design) =>
        design.equipment.specials.includes("specialType:canLevy"),
      )
    ) {
      throw new Error("Player has no levy designs");
    }

    return this;
  }

  handleAction(): IMutation[] {
    const design = this.player.activeDesigns
      .filter((design) => design.equipment.specials.includes("specialType:canLevy"))
      .sort(
        (a, b) =>
          a.yields.getLumpAmount("yieldType:strength") -
          b.yields.getLumpAmount("yieldType:strength"),
      )[0];

    return [
      { type: "remove", payload: { key: this.citizen.key } },
      new CreateUnit(this.player, design, { cityKey: this.city.key, status: "levy" }).create(
        this.city.tile,
      ),
    ];
  }

  pickCitizen(city: City): Citizen | undefined {
    // todo choose least productive Citizen
    return city.citizenKeys.size > 1 ? getRandom(Array.from(city.citizens)) : undefined;
  }
}
