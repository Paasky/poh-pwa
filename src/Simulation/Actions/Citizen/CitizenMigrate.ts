import { Citizen } from "@/Common/Models/Citizen";
import { City } from "@/Common/Models/City";
import { IMutation } from "@/Common/IMutation";
import { IAction } from "@/Simulation/Actions/IAction";
import { CitizenPickTile } from "@/Simulation/Actions/Citizen/CitizenPickTile";
import { getRandom } from "@/helpers/arrayTools";

// Note: a Player cannot decide to migrate a citizen,
// it only happens automatically if the city is full or very unhappy
export class CitizenMigrate implements IAction {
  constructor(
    private readonly citizen: Citizen,
    private readonly toCity: City,
  ) {}

  validateAction(): this {
    if (!this.toCity.tilesWithFreeCitizenSlots.length) {
      throw new Error(`City ${this.toCity.key} does not have any free slots for citizens`);
    }
    return this;
  }

  handleAction(): IMutation[] {
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
      if (citizen.policy && tile.city.player.government.policies.includes(citizen.policy))
        score += 10;
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
