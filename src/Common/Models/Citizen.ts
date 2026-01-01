import { canHaveOne, hasOne } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { City } from "@/Common/Models/City";
import type { Player } from "@/Common/Models/Player";
import type { Culture } from "@/Common/Models/Culture";
import type { Religion } from "@/Common/Models/Religion";
import type { Tile } from "@/Common/Models/Tile";
import { citizenYieldTypeKeys, Yield, Yields } from "@/Common/Objects/Yields";

export class Citizen extends GameObject {
  constructor(
    key: GameKey,
    public cityKey: GameKey,
    public cultureKey: GameKey,
    public playerKey: GameKey,
    public tileKey: GameKey,
    public religionKey: GameKey | null = null,
    public policy: TypeObject | null = null,
  ) {
    super(key);

    hasOne<City>(this, "cityKey");
    hasOne<Culture>(this, "cultureKey");
    hasOne<Player>(this, "playerKey");
    canHaveOne<Religion>(this, "religionKey");
    hasOne<Tile>(this, "tileKey");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "cityKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "cultureKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "playerKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "citizenKeys" } },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "citizenKeys" },
    },
    { attrName: "policy", isOptional: true, isTypeObj: true },
  ];

  /*
   * Attributes
   */

  /*
   * Relations
   */
  declare city: City;
  declare culture: Culture;
  declare player: Player;
  declare religion: Religion | null;
  declare tile: Tile;

  /*
   * Computed
   */

  // Types I give to the City
  get typesForCity(): Set<TypeObject> {
    return this.computed("_typesForCity", () => this.tile.typesForCitizen, ["tileKey"]);
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "_yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(citizenYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
        };

        // Citizen Yields are Culture + Religion + Tile + Player Mods
        const yields = new Yields();
        yields.add(...yieldsForMe(this.culture.yields));
        if (this.religion) yields.add(...yieldsForMe(this.religion.yields));
        yields.add(...yieldsForMe(this.tile.yields));
        yields.add(...yieldsForMe(this.city.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      ["cultureKey", "religionKey", "tileKey", "playerKey"],
    );
  }
}
