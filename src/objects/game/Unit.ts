import { canHaveOne, hasOne } from "@/objects/game/_mixins";
import { TypeObject } from "@/types/typeObjects";
import { computed, ref } from "vue";
import { Yields } from "@/objects/yield";
import { roundToTenth } from "@/types/common";
import { EventManager } from "@/managers/EventManager";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { UnitDesign } from "@/objects/game/UnitDesign";
import { Player } from "@/objects/game/Player";
import { TradeRoute } from "@/objects/game/TradeRoute";
import { City } from "@/objects/game/City";
import { Tile } from "@/objects/game/Tile";

// mercenary: +10% strength, +50% upkeep, 1/city/t;
// regular: no effects
// levy: -20% strength, -1 happy if not at war, 1/city/t; can be demobilized -> becomes citizen
// reserve: -90% strength and upkeep, cannot move;        can be mobilized -> becomes mobilized and remove citizen
// mobilizing1: -60% strength, -1 happy if not at war;    can be demobilized -> becomes reserve and citizen
// mobilizing2: -30% strength, -1 happy if not at war;    can be demobilized -> becomes reserve and citizen
// mobilized: -10% strength, -1 happy if not at war;      can be demobilized -> becomes reserve and citizen
export type UnitStatus =
  | "mercenary"
  | "regular"
  | "levy"
  | "reserve"
  | "mobilizing1"
  | "mobilizing2"
  | "mobilized";

export class Unit extends GameObject {
  constructor(
    key: GameKey,
    designKey: GameKey,
    playerKey: GameKey,
    tileKey: GameKey,
    cityKey?: GameKey,
    name?: string,
    action?: TypeObject,
    canAttack = false,
    health = 100,
    moves = 0,
    status: UnitStatus = "regular",
    origPlayerKey?: GameKey,
  ) {
    super(key);
    this.designKey = designKey;
    this.playerKey.value = playerKey;
    this.origPlayerKey = origPlayerKey ?? playerKey;
    this.tileKey.value = tileKey;
    if (cityKey) this.cityKey.value = cityKey;
    if (name) this.name.value = name;
    if (action) this.action.value = action;
    this.canAttack.value = canAttack;
    this.health.value = health;
    this.moves.value = moves;
    this.status.value = status;
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "designKey",
      attrNotRef: true,
      related: { theirKeyAttr: "unitKeys" },
    },
    { attrName: "playerKey", related: { theirKeyAttr: "unitKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "unitKeys" } },
    {
      attrName: "cityKey",
      isOptional: true,
      related: { theirKeyAttr: "unitKeys" },
    },
    { attrName: "name", isOptional: true },
    { attrName: "action", isOptional: true, isTypeObj: true },
    { attrName: "canAttack", isOptional: true },
    { attrName: "health", isOptional: true },
    { attrName: "moves", isOptional: true },
    { attrName: "status", isOptional: true },
    {
      attrName: "origPlayerKey",
      isOptional: true,
      attrNotRef: true,
    },
  ];

  name = ref("");
  action = ref<TypeObject | null>(null);
  canAttack = ref(false);
  health = ref(100);
  moves = ref(0);
  status = ref("regular" as UnitStatus);

  cityKey = ref(null as GameKey | null);
  city = canHaveOne(this.cityKey, City);

  designKey: GameKey;
  design = computed(() => useObjectsStore().get(this.designKey) as UnitDesign);

  playerKey = ref<GameKey>("" as GameKey);
  player = computed(() => useObjectsStore().get(this.playerKey.value) as Player);

  origPlayerKey: GameKey;
  origPlayer = computed(() => useObjectsStore().get(this.origPlayerKey) as Player);

  tileKey = ref("" as GameKey);
  tile = hasOne(this.tileKey, Tile);

  tradeRouteKey = ref<GameKey | null>(null);
  tradeRoute = canHaveOne(this.tradeRouteKey, TradeRoute);

  myTypes = computed((): TypeObject[] => [
    this.concept,
    this.design.value.platform,
    this.design.value.equipment,
  ]);
  types = computed((): TypeObject[] => {
    return this.myTypes.value.concat(this.tile.value.types.value);
  });

  // yields.only runs a filter, so reduce compute-ref-chaining by storing the result here
  private _playerYields = computed(() =>
    this.player.value.yields.value.only(this.concept.inheritYieldTypes!, this.types.value),
  );

  // yields.only runs a filter, so reduce compute-ref-chaining by storing the result here
  private _tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, this.types.value),
  );

  yields = computed(
    () =>
      new Yields([
        ...this.design.value.yields.all(),
        ...this._playerYields.value.all(),
        ...this._tileYields.value.all(),
      ]),
  );

  delete() {
    if (this.city.value)
      this.city.value.unitKeys.value = this.city.value.unitKeys.value.filter((u) => u !== this.key);
    this.design.value.unitKeys.value = this.design.value.unitKeys.value.filter(
      (k) => k !== this.key,
    );
    this.player.value.unitKeys.value = this.player.value.unitKeys.value.filter(
      (k) => k !== this.key,
    );
    this.tile.value.unitKeys.value = this.tile.value.unitKeys.value.filter((k) => k !== this.key);
    if (this.tradeRoute.value) {
      this.tradeRoute.value.delete(true);
    }
  }

  modifyHealth(amount: number) {
    this.health.value = Math.max(0, Math.min(100, roundToTenth(this.health.value + amount)));

    if (this.health.value <= 0) {
      new EventManager().create(
        "unitKilled",
        `${this.name.value} was killed`,
        this.player.value,
        this,
      );

      this.delete();
      return;
    }

    if (this.health.value >= 100 && this.action.value?.key === "actionType:heal") {
      new EventManager().create(
        "unitHealed",
        `${this.name.value} is fully healed`,
        this.player.value,
        this,
      );
      this.action.value = null;
    }
  }
}
