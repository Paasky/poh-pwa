import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { IMutation } from "@/Common/IMutation";
import { Citizen } from "@/Common/Models/Citizen";
import { belongsToCity, belongsToPlayer } from "@/Simulation/Validator";
import { getRandom } from "@/Common/Helpers/arrayTools";
import { createUnit } from "@/Simulation/MutationFactory";

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
      throw new Error("Actor has no levy designs");
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
      createUnit({
        playerKey: this.player.key,
        designKey: design.key,
        cityKey: this.city.key,
        status: "levy",
      }),
    ];
  }

  pickCitizen(city: City): Citizen | undefined {
    // todo choose least productive Citizen
    return city.citizenKeys.size > 1 ? getRandom(Array.from(city.citizens)) : undefined;
  }
}
