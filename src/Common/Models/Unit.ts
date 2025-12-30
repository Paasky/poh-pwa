/* eslint-disable @typescript-eslint/no-unused-expressions */
import { canHaveOne, hasOne } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Yields } from "@/Common/Objects/Yields";
import { roundToTenth, TypeKey } from "@/Common/Objects/Common";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import type { UnitDesign } from "@/Common/Models/UnitDesign";
import type { City } from "@/Common/Models/City";
import type { Player } from "@/Common/Models/Player";
import type { TradeRoute } from "@/Common/Models/TradeRoute";
import { type Tile } from "@/Common/Models/Tile";
import { useEventStore } from "@/stores/eventStore";
import { UnitCreated, UnitHealed, UnitLost } from "@/events/Unit";
import { getCoordsFromTileKey, getHexNeighborCoords, tileKey } from "@/helpers/mapTools";
import { UnitMovement } from "@/Simulation/Movement/UnitMovement";
import { ActionType } from "@/Common/IAction";

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
    public action: { type: ActionType; target: null | GameKey } | null = null,
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
    const store = useDataBucket();
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

  // Unit yields is
  // -> the total lump output (+/-) of Design + Tile
  // -> the YieldMods of Design
  // -> the YieldMods that are for me of Player & Tile
  get yields(): Yields {
    const inheritYieldTypes = [
      "yieldType:attack",
      "yieldType:damage",
      "yieldType:defense",
      "yieldType:evasion",
      "yieldType:heal",
      "yieldType:hitRadius",
      "yieldType:intercept",
      "yieldType:missileSlot",
      "yieldType:moves",
      "yieldType:paradropRange",
      "yieldType:range",
      "yieldType:sightRadius",
      "yieldType:settleSize",
      "yieldType:strength",
      "yieldType:tradeRange",
      "yieldType:tradeYield",
      "yieldType:upkeep",
    ] as TypeKey[];

    // Everything that I can inherit from my UnitDesign
    const yields = this.design.yields.only(inheritYieldTypes);

    // Everything that I can inherit, that is for me, from my Tile.yields
    for (const y of this.tile.yields.only(inheritYieldTypes, this.types).all()) {
      yields.add(y);
    }

    // Everything that I can inherit, that is for me, from my Player.yieldMods
    for (const y of this.player.yieldMods.only(inheritYieldTypes, this.types).all()) {
      yields.add(y);
    }

    return yields;
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

    if (this.health >= 100 && this.action?.type === "heal") {
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

    delete useDataBucket()._gameObjects[this.key];

    useEventStore().turnEvents.push(new UnitLost(this.name, this.player, this.tile, reason, city));
  }

  startTurn(): void {
    // Reset moves
    this.movement.moves = this.design.yields.getLumpAmount("yieldType:moves");

    // Heal
    if (this.health < 100 && this.action?.type === "heal") {
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
