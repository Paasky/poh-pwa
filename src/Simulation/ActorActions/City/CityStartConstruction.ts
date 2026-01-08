import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { IMutation } from "@/Common/IMutation";
import { belongsToCity, belongsToPlayer } from "@/Simulation/Validator";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Construction } from "@/Common/Models/Construction";
import { Tile } from "@/Common/Models/Tile";
import { useDataBucket } from "@/Data/useDataBucket";

export class CityStartConstruction implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly type: TypeObject,
    private readonly tile: Tile,
    private readonly index = 0,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.city);
    belongsToCity(this.city, this.tile);
    if (this.tile.construction) {
      throw new Error("Tile already has a Construction");
    }

    switch (this.type.class) {
      case "buildingType":
      case "nationalWonderType":
      case "worldWonderType":
        if (
          this.city.constructionQueue.items.some(
            (qItem) => (qItem.item as Construction).type.key === this.type.key,
          )
        ) {
          throw new Error(`${this.type.key} is already in queue`);
        }
        if (!this.type.requires.isSatisfied([...this.player.types, ...this.tile.types])) {
          throw new Error(`${this.type.key} cannot be built on this tile`);
        }
        break;
      default:
        throw new Error(`Invalid type class ${this.type.class}`);
    }

    // Building is OK
    if (this.type.class === "buildingType") return this;

    // For National/World Wonders, check if already (being) built in player's/any cities
    const cities =
      this.type.class === "nationalWonderType"
        ? this.player.cities
        : useDataBucket().getClassObjects<City>("city");

    cities.forEach((city) => {
      city.constructions.forEach((construction) => {
        if (construction.type.key === this.type.key) {
          // If it's a national wonder, we've found it in one of the player's cities
          // If it's a world wonder, we've found it in any city

          // Can't build if already built
          if (construction.completedAtTurn) {
            throw new Error(`${this.type.key} is already built`);
          }

          // Can only be built in one of the player's cities
          if (city.playerKey === this.player.key) {
            throw new Error(`${this.type.key} is already being built in ${city.name}`);
          }
        }
      });
    });

    return this;
  }

  handleAction(): IMutation[] {
    return [
      {
        type: "update",
        payload: {
          key: this.city.key,
          constructionQueue: { tile: this.tile, type: this.type, index: this.index },
        },
      },
    ];
  }
}
