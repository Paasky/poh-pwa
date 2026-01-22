import { Citizen } from "@/Common/Models/Citizen";
import { City } from "@/Common/Models/City";
import { PohMutation } from "@/Common/PohMutation";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { CitizenPickTile } from "@/Simulation/ActorActions/City/CitizenPickTile";
import { getRandom } from "@/Common/Helpers/arrayTools";
import { useDataBucket } from "@/Data/useDataBucket";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { createUnit } from "@/Simulation/MutationFactory";

// Note: a Actor cannot decide to migrate a citizen,
// it only happens automatically if the city is full or very unhappy
export class CitizenMigrate implements ISimAction {
  constructor(
    private readonly citizen: Citizen,
    private readonly toCity?: City, // If empty, Citizen will immediately convert to Settler (assuming no available cities)
  ) {}

  validateAction(): this {
    if (!this.toCity) return this;

    if (!this.toCity.tilesWithFreeCitizenSlots.length) {
      throw new Error(`City ${this.toCity.key} does not have any free slots for citizens`);
    }
    return this;
  }

  handleAction(): PohMutation[] {
    if (this.toCity) {
      this.citizen.playerKey = this.toCity.playerKey;
      this.citizen.cityKey = this.toCity.key;

      // No validation, we already know the city can accept the citizen
      const mutation = new CitizenPickTile(
        this.toCity.player,
        this.citizen,
        CitizenPickTile.getTile(this.toCity)!,
      ).handleAction()[0];

      mutation.payload.playerKey = this.toCity.playerKey;
      mutation.payload.cityKey = this.toCity.key;

      return [mutation];
    }

    // No city -> convert to Settler
    const settlerDesign =
      // Actor settler design with the highest prod cost
      this.citizen.player.activeDesigns
        .filter((design) => design.equipment.category === "equipmentCategory:settler")
        .sort((a, b) => b.productionCost - a.productionCost)[0] ??
      // Fallback to global Settler design
      Array.from(useDataBucket().getClassObjects<UnitDesign>("unitDesign")).filter(
        (design) => design.equipment.category === "equipmentCategory:settler" && !design.playerKey,
      )[0];

    if (!settlerDesign) throw new Error("Invalid World: No settler design found");

    return [
      { type: "remove", payload: { key: this.citizen.key } },
      createUnit({
        playerKey: this.citizen.playerKey,
        designKey: settlerDesign.key,
        tileKey: this.citizen.city.tileKey,
      }),
    ];
  }

  static getCity(citizen: Citizen): City | undefined {
    // Score cities (that current city owner knows):
    // + 1p per free slot
    // + 10p if owner follows same religion
    // + 10p if owner has preferred policy
    // - 10p if owner is same culture (promote emigration)

    const cities = [] as { city: City; score: number }[];
    citizen.city.player.knownTiles.forEach((tile) => {
      if (!tile.city) return;

      const tilesWithFreeCitizenSlots = tile.city.tilesWithFreeCitizenSlots;
      if (!tilesWithFreeCitizenSlots.length) return;

      let score = tilesWithFreeCitizenSlots.reduce(
        (acc, tile) => acc + tile.freeCitizenSlotCount,
        0,
      );
      // Note: if citizen has no religion, will get points from atheist players
      if (tile.city.player.religionKey === citizen.religionKey) score += 10;
      if (citizen.policy && tile.city.player.government.policies.has(citizen.policy)) score += 10;
      if (tile.city.player.cultureKey === citizen.cultureKey) score -= 10;

      cities.push({ city: tile.city, score });
    });

    if (!cities.length) return;

    const sorted = cities.sort((a, b) => b.score - a.score);
    const possibleCities = [] as City[];

    let prevScore = 0;
    for (const city of sorted) {
      if (!possibleCities.length || city.score === prevScore) possibleCities.push(city.city);
      prevScore = city.score;
    }

    return getRandom(possibleCities);
  }
}
