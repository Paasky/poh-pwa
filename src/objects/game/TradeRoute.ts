import { HasTiles } from "@/objects/game/_mixins";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { computed } from "vue";
import { City } from "@/objects/game/City";
import { useObjectsStore } from "@/stores/objectStore";
import { Unit } from "@/objects/game/Unit";

export class TradeRoute extends HasTiles(GameObject) {
  constructor(
    key: GameKey,
    city1Key: GameKey,
    city2Key: GameKey,
    tileKeys: GameKey[],
    unitKey: GameKey,
  ) {
    super(key);
    this.city1Key = city1Key;
    this.city2Key = city2Key;
    this.tileKeys.value = tileKeys;
    this.unitKey = unitKey;
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "unitKey",
      attrNotRef: true,
      related: { theirKeyAttr: "tradeRouteKey", isOne: true },
    },
    {
      attrName: "tileKeys",
      related: { theirKeyAttr: "tradeRouteKeys" },
    },
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
  ];

  city1Key = "" as GameKey;
  city1 = computed(() => useObjectsStore().get(this.city1Key) as City);

  city2Key = "" as GameKey;
  city2 = computed(() => useObjectsStore().get(this.city2Key) as City);

  unitKey = "" as GameKey;
  unit = computed(() => useObjectsStore().get(this.unitKey) as Unit);

  delete(unitIsDead = false) {
    this.city1.value.tradeRouteKeys.value =
      this.city1.value.tradeRouteKeys.value.filter((k) => k !== this.key);

    this.city2.value.tradeRouteKeys.value =
      this.city2.value.tradeRouteKeys.value.filter((k) => k !== this.key);

    for (const tile of this.tiles.value) {
      tile.tradeRouteKeys.value = tile.tradeRouteKeys.value.filter(
        (k) => k !== this.key,
      );
    }

    if (!unitIsDead) this.unit.value.tradeRouteKey.value = null;
  }
}
