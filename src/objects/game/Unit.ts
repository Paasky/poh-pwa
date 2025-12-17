/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-expressions */
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
import { useEventStore } from "@/stores/eventStore";
import { UnitCreated, UnitLost } from "@/events/Unit";

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

export type MoveContext = {
  // Visibility/knowledge policy
  canEnterUnknownThisTurn?: boolean;
  isCurrentTurnStep?: boolean;
  // Board state
  known: ReadonlySet<GameKey>;
  visible: ReadonlySet<GameKey>;
  hasFriendlyUnit: (tile: Tile) => boolean;
  hasEnemyUnit: (tile: Tile) => boolean;
  // Unit state
  embarked?: boolean;
};

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

  yields = computed(() => new Yields());

  /*
   * Actions
   */
  modifyHealth(amount: number, reason: string) {
    this.health.value = Math.max(0, Math.min(100, roundToTenth(this.health.value + amount)));

    const city =
      this.tile.value.city.value ??
      this.tile.value.getNeighbors(3).find((t) => t.city.value)?.city.value;

    if (this.health.value <= 0) {
      this.delete(reason, city);
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

  // Return null if can't, 99 if it will end the turn
  moveCost(to: Tile, from?: Tile, context?: MoveContext): number | null {
    const myDomainKey = this.design.value.domainKey();
    from = from ?? this.tile.value;

    /*
     * Step 1) Check if the unit can move at all
     */

    // Air/Space units can't move
    if (myDomainKey === "domainType:air" || myDomainKey === "domainType:space") return null;

    // Can only enter unknown during the current turn
    if (context && !context.known.has(to.key)) {
      if (!context.isCurrentTurnStep) {
        return null;
      }
    }

    // Water units can enter land only if it has a canal or city
    if (myDomainKey === "domainType:water" && to.domain.id !== "water") {
      if (!to.cityKey && to.construction.value?.type.key !== "improvementType:canal") return null;
    }

    // Land units can enter water only if the player has that special
    if (myDomainKey === "domainType:land" && to.domain.id === "water") {
      if (!this.player.value.knownTypes.value.find((t) => t.key === "specialType:canEmbark")) {
        return null;
      }
    }

    // Tile specials check
    if (to.terrain.key === "terrainType:sea") {
      if (!this.player.value.knownTypes.value.find((t) => t.key === "specialType:canEnterSea")) {
        return null;
      }
    }

    if (to.terrain.key === "terrainType:ocean") {
      if (!this.player.value.knownTypes.value.find((t) => t.key === "specialType:canEnterOcean")) {
        return null;
      }
    }

    if (to.terrain.key === "featureType:ice") {
      if (!this.player.value.knownTypes.value.find((t) => t.key === "specialType:canEnterIce")) {
        return null;
      }
    }

    if (
      to.terrain.key === "elevationType:mountain" ||
      to.terrain.key === "elevationType:snowMountain"
    ) {
      if (
        !this.player.value.knownTypes.value.find((t) => t.key === "specialType:canEnterMountains")
      ) {
        return null;
      }
    }

    /*
     * Step 2) Check if the move ends the turn
     */

    // Switching domains without a Route on both tiles
    if (from.domain.key !== to.domain.key) {
      // todo check route when it exists
      return 99;
      // if (!from.route && !to.route) {
      //   return 99;
      // }
    }

    // Land unit entering a new River without a Route
    if (to.riverKey && from.riverKey !== to.riverKey) {
      // todo check route when it exists
      return 99;
      // if (!from.route && !to.route) {
      //   return 99;
      // }
    }

    // todo Zone of Control check

    // todo routes set a lower move cost

    // todo get move cost from tile

    return 1;
  }

  complete() {
    if (this.city.value) {
      this.city.value.unitKeys.value.push(this.key);
    }

    this.design.value.unitKeys.value.push(this.key);

    this.player.value.unitKeys.value.push(this.key);

    this.tile.value.unitKeys.value.push(this.key);

    // Use any as IDE has a Ref value mismatch
    useEventStore().turnEvents.push(new UnitCreated(this) as any);
  }

  delete(reason: string, city?: City | null) {
    if (this.city.value) {
      this.city.value.unitKeys.value = this.city.value.unitKeys.value.filter((u) => u !== this.key);
    }

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

    delete useObjectsStore()._gameObjects[this.key];

    useEventStore().turnEvents.push(
      // Use any as IDE has a Ref value mismatch
      new UnitLost(this.name.value, this.player.value, this.tile.value, reason, city) as any,
    );
  }

  startTurn(): void {
    // Reset moves
    this.moves.value = this.design.value.yields.getLumpAmount("yieldType:moves");

    // Heal
    if (this.health.value < 100 && this.action.value?.key === "actionType:heal") {
      this.modifyHealth(10, "healing");
    }
  }

  endTurn(): boolean {
    // todo run automove / trade route move until out of moves/see danger
    return true;
  }

  warmUp(): void {
    this.city.value;
    this.design.value;
    this.player.value;
    this.origPlayer.value;
    this.tile.value;
    this.tradeRoute.value;

    this.myTypes.value;
    this.playerYields.value;
    this.tileYields.value;
    this.types.value;
    this.yields.value;
  }
}
