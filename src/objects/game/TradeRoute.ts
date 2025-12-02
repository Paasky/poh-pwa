import { ComputedRef, ref } from "vue";
import { hasMany, hasOne } from "@/objects/game/_relations";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { City } from "@/objects/game/City";
import type { Unit } from "@/objects/game/Unit";
import type { Tile } from "@/objects/game/Tile";

export class TradeRoute extends GameObject {
  constructor(
    key: GameKey,
    city1Key: GameKey,
    city2Key: GameKey,
    tileKeys: GameKey[],
    unitKey: GameKey,
  ) {
    super(key);

    this.city1Key = city1Key;
    this.city1 = hasOne<City>(this.city1Key, `${this.key}.city1`);

    this.city2Key = city2Key;
    this.city2 = hasOne<City>(this.city2Key, `${this.key}.city2`);

    this.tileKeys.value = tileKeys;

    this.unitKey = unitKey;
    this.unit = hasOne<Unit>(this.unitKey, `${this.key}.unit`);
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "city1Key",
      attrNotRef: true,
      related: { theirKeyAttr: "tradeRouteKeys" },
    },
    {
      attrName: "city2Key",
      attrNotRef: true,
      related: { theirKeyAttr: "tradeRouteKeys" },
    },
    {
      attrName: "tileKeys",
      related: { theirKeyAttr: "tradeRouteKeys", isManyToMany: true },
    },
    {
      attrName: "unitKey",
      attrNotRef: true,
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
  city1Key: GameKey;
  city1: ComputedRef<City>;

  city2Key: GameKey;
  city2: ComputedRef<City>;

  tileKeys = ref([] as GameKey[]);
  tiles = hasMany<Tile>(this.tileKeys, `${this.key}.tiles`);

  unitKey: GameKey;
  unit: ComputedRef<Unit>;

  /*
   * Computed
   */
  // todo add here

  /*
   * Actions
   */
  delete(unitIsDead = false) {
    this.city1.value.tradeRouteKeys.value = this.city1.value.tradeRouteKeys.value.filter(
      (k) => k !== this.key,
    );

    this.city2.value.tradeRouteKeys.value = this.city2.value.tradeRouteKeys.value.filter(
      (k) => k !== this.key,
    );

    for (const tile of this.tiles.value) {
      tile.tradeRouteKeys.value = tile.tradeRouteKeys.value.filter((k) => k !== this.key);
    }

    if (!unitIsDead) this.unit.value.tradeRouteKey.value = null;
  }
}
