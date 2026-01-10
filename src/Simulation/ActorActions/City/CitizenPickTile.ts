import { Player } from "@/Common/Models/Player";
import { Citizen } from "@/Common/Models/Citizen";
import { Tile } from "@/Common/Models/Tile";
import { createMutation, IMutation } from "@/Common/IMutation";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { belongsToCity, belongsToPlayer } from "@/Simulation/Validator";
import { City } from "@/Common/Models/City";
import { getRandom } from "@/Common/Helpers/arrayTools";

export class CitizenPickTile implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly citizen: Citizen,
    private readonly tile: Tile,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.citizen);
    belongsToCity(this.citizen.city, this.tile);

    if (!this.tile.freeCitizenSlotCount) {
      throw new Error("Tile does not have a free slot");
    }
    return this;
  }

  handleAction(): IMutation[] {
    this.citizen.tileKey = this.tile.key;
    const mutation = createMutation("update", this.citizen.key);
    mutation.payload.tileKey = this.citizen.tileKey;
    return [mutation];
  }

  static getTile(city: City): Tile | undefined {
    const tiles = city.tilesWithFreeCitizenSlots;
    if (!tiles.length) return undefined;

    // todo: select top yield tile by city preference
    return getRandom(tiles);
  }
}
