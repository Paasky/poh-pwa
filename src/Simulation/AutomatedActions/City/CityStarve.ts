import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { City } from "@/Common/Models/City";
import { createMutation, PohMutation } from "@/Common/PohMutation";
import { getRandom } from "@/Common/Helpers/arrayTools";

// Note: a Actor cannot decide to starve a City,
// it only happens automatically if the City runs out of food in storage.
export class CityStarve implements ISimAction {
  constructor(private readonly city: City) {}

  validateAction(): this {
    if (this.city.citizenKeys.size <= 1) {
      throw new Error("Cannot starve a city with only one citizen");
    }
    return this;
  }

  handleAction(): PohMutation[] {
    return [createMutation("remove", getRandom(Array.from(this.city.citizenKeys)))];
  }
}
