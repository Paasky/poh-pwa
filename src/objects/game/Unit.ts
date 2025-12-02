import { canHaveOne, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef, Ref, ref } from "vue";
import { Yields } from "@/objects/yield";
import { roundToTenth } from "@/types/common";
import { EventManager } from "@/managers/EventManager";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { UnitDesign } from "@/objects/game/UnitDesign";
import type { City } from "@/objects/game/City";
import type { Player } from "@/objects/game/Player";
import type { TradeRoute } from "@/objects/game/TradeRoute";
import type { Tile } from "@/objects/game/Tile";

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
    if (action) this.action.value = action;
    this.canAttack.value = canAttack;
    this.health.value = health;
    this.moves.value = moves;
    if (name) this.name.value = name;
    this.status.value = status;

    if (cityKey) this.cityKey.value = cityKey;

    this.designKey = designKey;

    // noinspection DuplicatedCode
    this.origPlayerKey = origPlayerKey ?? playerKey;
    this.origPlayer = hasOne<Player>(this.origPlayerKey, `${this.key}.origPlayer`);

    this.playerKey = ref(playerKey);
    this.player = hasOne<Player>(this.playerKey, `${this.key}.player`);

    this.tileKey = ref(tileKey);
    this.tile = hasOne<Tile>(this.tileKey, `${this.key}.tile`);
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

  /*
   * Attributes
   */
  action = ref<TypeObject | null>(null);
  canAttack = ref(false);
  health = ref(100);
  moves = ref(0);
  name = ref("");
  status = ref("regular" as UnitStatus);

  /*
   * Relations
   */
  cityKey = ref(null as GameKey | null);
  city = canHaveOne<City>(this.cityKey, `${this.key}.city`);

  designKey: GameKey;
  design = computed(() => useObjectsStore().get(this.designKey) as UnitDesign);

  playerKey: Ref<GameKey>;
  player: ComputedRef<Player>;

  origPlayerKey: GameKey;
  origPlayer: ComputedRef<Player>;

  tileKey: Ref<GameKey>;
  tile: ComputedRef<Tile>;

  tradeRouteKey = ref<GameKey | null>(null);
  tradeRoute = canHaveOne<TradeRoute>(this.tradeRouteKey, `${this.key}.tradeRoute`);

  /*
   * Computed
   */
  myTypes = computed((): TypeObject[] => [
    this.concept,
    this.design.value.platform,
    this.design.value.equipment,
  ]);

  playerYields = computed(() =>
    this.player.value.yields.value.only(this.concept.inheritYieldTypes!, this.types.value),
  );

  tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, this.types.value),
  );

  types = computed((): TypeObject[] => {
    return this.myTypes.value.concat(this.tile.value.types.value);
  });

  yields = computed(
    () =>
      new Yields([
        ...this.design.value.yields.all(),
        ...this.playerYields.value.all(),
        ...this.tileYields.value.all(),
      ]),
  );

  /*
   * Actions
   */
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
