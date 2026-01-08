import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { City } from "@/Common/Models/City";
import { Tile } from "@/Common/Models/Tile";
import { IMutation } from "@/Common/IMutation";
import { getRandom } from "@/helpers/arrayTools";
import { belongsToCity } from "@/Simulation/Validator";
import { generateKey } from "@/Common/Models/_GameTypes";
import { Citizen } from "@/Common/Models/Citizen";
import { useDataBucket } from "@/Data/useDataBucket";
import { CitizenMigrate } from "@/Simulation/ActorActions/City/CitizenMigrate";

// Note: a Actor cannot decide to expand a City,
// it only happens automatically if the City has enough culture in storage.
export class CityGrow implements ISimAction {
  constructor(
    private readonly city: City,
    private readonly tile?: Tile, // If empty, Citizen will immediately migrate (assuming no space in City)
  ) {}

  validateAction(): this {
    if (!this.tile) return this;

    belongsToCity(this.city, this.tile);
    if (!this.tile.freeCitizenSlotCount) throw new Error("Tile does not have a free slot");

    return this;
  }

  handleAction(): IMutation[] {
    const policyKeys = this.city.player.research.knownTypeKeys.filter((key) =>
      key.startsWith("policyType:"),
    );
    const religions = Array.from(this.city.religions.values()).map((r) => r.religion);

    const mutations: IMutation[] = [];
    const newCitizenMutation: IMutation = {
      type: "create",
      payload: {
        key: generateKey("citizen"),
        cityKey: this.city.key,
        tileKey: this.tile?.key ?? this.city.tileKey,
        cultureKey: this.city.player.cultureKey,
        policy: policyKeys.length ? useDataBucket().getType(getRandom(policyKeys)) : undefined,
        religionKey: religions.length ? getRandom(religions).key : undefined,
      } as Partial<Citizen>,
    };
    mutations.push(newCitizenMutation);

    // No Tile given -> migrate immediately
    if (!this.tile) {
      const partialCitizen = {
        city: this.city,
        player: this.city.player,
        ...newCitizenMutation.payload,
      } as Citizen;
      const city = CitizenMigrate.getCity(partialCitizen);

      mutations.push(...new CitizenMigrate(partialCitizen, city).handleAction());
    }

    return mutations;
  }

  static pickTile(city: City): Tile | undefined {
    const availableTiles = city.tilesWithFreeCitizenSlots;
    if (!availableTiles.length) return undefined;

    // todo: pick tile by city preference
    return getRandom(availableTiles);
  }
}
