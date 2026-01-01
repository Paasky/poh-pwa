import { hasMany, hasOne } from "@/Common/Models/_Relations";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { City } from "@/Common/Models/City";
import type { Unit } from "@/Common/Models/Unit";
import type { Tile } from "@/Common/Models/Tile";
import { tradeRouteYieldTypeKeys, Yield, Yields } from "@/Common/Objects/Yields";
import { TypeObject } from "@/Common/Objects/TypeObject";

export class TradeRoute extends GameObject {
  constructor(
    key: GameKey,
    public city1Key: GameKey,
    public city2Key: GameKey,
    public tileKeys: Set<GameKey>,
    public unitKey: GameKey,
  ) {
    super(key);

    hasOne<City>(this, "city1Key");
    hasOne<City>(this, "city2Key");
    hasMany<Tile>(this, "tileKeys");
    hasOne<Unit>(this, "unitKey");
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "city1Key",
      related: { theirKeyAttr: "tradeRouteKeys" },
    },
    {
      attrName: "city2Key",
      related: { theirKeyAttr: "tradeRouteKeys" },
    },
    {
      attrName: "tileKeys",
      related: { theirKeyAttr: "tradeRouteKeys", isManyToMany: true },
    },
    {
      attrName: "unitKey",
      related: { theirKeyAttr: "tradeRouteKey", isOne: true },
    },
  ];

  /*
   * Attributes
   */
  // todo add here

  /*
   * Relations
   */
  declare city1: City;

  declare city2: City;

  declare tiles: Tile[];

  declare unit: Unit;

  /*
   * Computed
   */

  // My Yield output
  get yields(): Yields {
    return this.computed("_yields", () => {
      const yieldsForMe = (yields: Yields): Yield[] => {
        return yields.only(tradeRouteYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
      };

      // Trade Route Yields are From the two cities
      const yields = new Yields();
      yields.add(...yieldsForMe(this.city1.yieldMods));
      yields.add(...yieldsForMe(this.city2.yieldMods));

      // Flatten Yields to apply modifiers
      return yields.flatten();
    });
  }

  /*
   * Actions
   */
  delete(unitIsDead = false) {
    this.city1.tradeRouteKeys.delete(this.key);

    this.city2.tradeRouteKeys.delete(this.key);

    for (const tile of this.tiles) {
      tile.tradeRouteKeys.delete(this.key);
    }

    if (!unitIsDead) this.unit.tradeRouteKey = null;
  }
}
