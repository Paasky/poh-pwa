import { hasMany, hasOne } from "@/objects/game/_relations";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { City } from "@/objects/game/City";
import type { Unit } from "@/objects/game/Unit";
import type { Tile } from "@/objects/game/Tile";

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
  // todo add here

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
