/* eslint-disable @typescript-eslint/no-unused-expressions */
import { canHaveOne, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { Yields } from "@/objects/yield";
import { roundToTenth } from "@/types/common";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { UnitDesign } from "@/objects/game/UnitDesign";
import type { City } from "@/objects/game/City";
import type { Player } from "@/objects/game/Player";
import type { TradeRoute } from "@/objects/game/TradeRoute";
import { type Tile } from "@/objects/game/Tile";
import { useEventStore } from "@/stores/eventStore";
import { UnitCreated, UnitHealed, UnitLost } from "@/events/Unit";
import { getCoordsFromTileKey, getHexNeighborCoords, tileKey } from "@/helpers/mapTools";
import { UnitMovement } from "@/movement/UnitMovement";

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
    public designKey: GameKey,
    public playerKey: GameKey,
    public tileKey: GameKey,
    public cityKey: GameKey | null = null,
    public customName = "",
    public action: TypeObject | null = null,
    public canAttack = false,
    public health = 100,
    moves = 0,
    public status: UnitStatus = "regular",
    public origPlayerKey: GameKey = playerKey,
  ) {
    super(key);
    this.movement = new UnitMovement(this);
    this.movement.moves = moves;

    hasOne<UnitDesign>(this, "designKey");

    hasOne<Player>(this, "origPlayerKey");
    hasOne<Player>(this, "playerKey");
    hasOne<Tile>(this, "tileKey");

    this.tradeRouteKey = null;
    canHaveOne<City>(this, "cityKey");
    canHaveOne<TradeRoute>(this, "tradeRouteKey");
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "designKey",
      related: { theirKeyAttr: "unitKeys" },
    },
    { attrName: "playerKey", related: { theirKeyAttr: "unitKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "unitKeys" } },
    {
      attrName: "cityKey",
      isOptional: true,
      related: { theirKeyAttr: "unitKeys" },
    },
    { attrName: "customName", isOptional: true },
    { attrName: "action", isOptional: true, isTypeObj: true },
    { attrName: "canAttack", isOptional: true },
    { attrName: "health", isOptional: true },
    { attrName: "moves", isOptional: true },
    { attrName: "status", isOptional: true },
    {
      attrName: "origPlayerKey",
      isOptional: true,
    },
  ];

  /*
   * Attributes
   */
  movement: UnitMovement;
  unwatchers: (() => void)[] = [];

  /*
   * Relations
   */
  declare city: City | null;

  declare design: UnitDesign;

  declare player: Player;

  declare origPlayer: Player;

  declare tile: Tile;

  tradeRouteKey: GameKey | null;
  declare tradeRoute: TradeRoute | null;

  /*
   * Computed
   */
  get myTypes(): TypeObject[] {
    return [this.concept, this.design.platform, this.design.equipment];
  }

  get name(): string {
    return this.customName || this.design.name;
  }

  get playerYields(): Yields {
    return this.player.yields.only(this.concept.inheritYieldTypes!, this.types);
  }

  get tileYields(): Yields {
    return this.tile.yields.only(this.concept.inheritYieldTypes!, this.types);
  }

  get types(): TypeObject[] {
    return this.myTypes.concat(this.tile.types);
  }

  get visibleTileKeys(): Set<GameKey> {
    const store = useObjectsStore();
    const center = getCoordsFromTileKey(this.tileKey);
    const neighbors = getHexNeighborCoords(store.world.size, center, 2);
    const keys = new Set<GameKey>();
    keys.add(this.tileKey);
    for (const c of neighbors) {
      keys.add(tileKey(c.x, c.y));
    }
    return keys;
  }

  get vitals(): Yields {
    return new Yields([
      {
        type: "yieldType:health",
        amount: this.health,
        method: "lump",
        for: [],
        vs: [],
        max: 100,
      },
      {
        type: "yieldType:moves",
        amount: this.movement.moves,
        method: "lump",
        for: [],
        vs: [],
        max: this.movement.maxMoves,
      },
    ]);
  }

  get yields(): Yields {
    return new Yields();
  }

  /*
   * Actions
   */
  modifyHealth(amount: number, reason: string) {
    this.health = Math.max(0, Math.min(100, roundToTenth(this.health + amount)));

    const city = this.tile.city ?? this.tile.neighborTiles.find((t) => t.city)?.city;

    if (this.health <= 0) {
      this.delete(reason, city);
      return;
    }

    if (this.health >= 100 && this.action?.key === "actionType:heal") {
      useEventStore().turnEvents.push(new UnitHealed(this));
      this.action = null;
    }
  }

  complete() {
    if (this.city) {
      this.city.unitKeys.add(this.key);
    }

    this.design.unitKeys.add(this.key);

    this.player.unitKeys.add(this.key);

    this.tile.unitKeys.add(this.key);

    useEventStore().turnEvents.push(new UnitCreated(this));
  }

  delete(reason: string, city?: City | null) {
    this.unwatchers.forEach((u) => u());

    if (this.city) {
      this.city.unitKeys.delete(this.key);
    }

    this.design.unitKeys.delete(this.key);

    this.player.unitKeys.delete(this.key);

    this.tile.unitKeys.delete(this.key);

    if (this.tradeRoute) {
      this.tradeRoute.delete(true);
    }

    delete useObjectsStore()._gameObjects[this.key];

    useEventStore().turnEvents.push(new UnitLost(this.name, this.player, this.tile, reason, city));
  }

  startTurn(): void {
    // Reset moves
    this.movement.moves = this.design.yields.getLumpAmount("yieldType:moves");

    // Heal
    if (this.health < 100 && this.action?.key === "actionType:heal") {
      this.modifyHealth(10, "healing");
    }
  }

  warmUp(): void {
    this.city;
    this.design;
    this.player;
    this.origPlayer;
    this.tile;
    this.tradeRoute;

    this.movement.isMobile;
    this.movement.specialTypeKeys;
    this.myTypes;
    this.name;
    this.playerYields;
    this.tileYields;
    this.types;
    this.visibleTileKeys;
    this.yields;
  }

  // moves is stored inside movement
  toJSON(): Record<string, unknown> {
    const json = super.toJSON();
    json.moves = this.movement.moves;
    return json;
  }
}
