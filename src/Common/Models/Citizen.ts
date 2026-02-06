import { TypeObject } from "../Static/Objects/TypeObject";
import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import type { City } from "./City";
import type { Player } from "./Player";
import type { Culture } from "./Culture";
import type { Religion } from "./Religion";
import type { Tile } from "./Tile";
import { citizenYieldTypeKeys, Yield, Yields } from "../Static/Objects/Yields";

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
  get city(): City {
    return this.hasOne<City>("city", "cityKey");
  }
  get culture(): Culture {
    return this.hasOne<Culture>("culture", "cultureKey");
  }
  get player(): Player {
    return this.hasOne<Player>("player", "playerKey");
  }
  get religion(): Religion | null {
    return this.canHaveOne<Religion>("religion", "religionKey");
  }
  get tile(): Tile {
    return this.hasOne<Tile>("tile", "tileKey");
  }

  /*
   * Computed
   */

  // Types I give to the City
  get typesForCity(): Set<TypeObject> {
    return this.computed("typesForCity", () => this.tile.typesForCitizen, {
      relations: [{ relName: "tile", relProps: ["typesForCitizen"] }],
    });
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(citizenYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
        };

        // Citizen Yields are Culture + Religion + Tile + Actor Mods
        const yields = new Yields();
        yields.add(...yieldsForMe(this.culture.yields));
        if (this.religion) yields.add(...yieldsForMe(this.religion.yields));
        yields.add(...yieldsForMe(this.tile.yields));
        yields.add(...yieldsForMe(this.city.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      {
        relations: [
          { relName: "culture", relProps: ["yields"] },
          { relName: "religion", relProps: ["yields"] },
          { relName: "tile", relProps: ["yields"] },
          { relName: "city", relProps: ["yieldMods"] },
        ],
      },
    );
  }
}
