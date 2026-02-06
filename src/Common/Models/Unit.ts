/* eslint-disable @typescript-eslint/no-unused-expressions */
import { TypeObject } from "../Static/Objects/TypeObject";
import { unitYieldTypeKeys, Yield, Yields } from "../Static/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import type { UnitDesign } from "./UnitDesign";
import type { City } from "./City";
import type { Player } from "./Player";
import type { TradeRoute } from "./TradeRoute";
import { type Tile } from "./Tile";
import { getCoordsFromTileKey, getHexNeighborCoords, tileKey } from "../Helpers/mapTools";
import { UnitMovement } from "@/Simulation/Movement/UnitMovement";
import { ActionType } from "../PohAction";

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

    this.tradeRouteKey = null;
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

  /*
   * Relations
   */
  get city(): City | null {
    return this.canHaveOne<City>("city", "cityKey");
  }

  get design(): UnitDesign {
    return this.hasOne<UnitDesign>("design", "designKey");
  }

  get player(): Player {
    return this.hasOne<Player>("player", "playerKey");
  }

  get origPlayer(): Player {
    return this.hasOne<Player>("origPlayer", "origPlayerKey");
  }

  get tile(): Tile {
    return this.hasOne<Tile>("tile", "tileKey");
  }

  tradeRouteKey: GameKey | null;
  get tradeRoute(): TradeRoute | null {
    return this.canHaveOne<TradeRoute>("tradeRoute", "tradeRouteKey");
  }

  /*
   * Computed
   */
  get isAgent(): boolean {
    return this.computed(
      "isAgent",
      () =>
        [
          "equipmentCategory:diplomat",
          "equipmentCategory:missionary",
          "equipmentCategory:spy",
        ].includes(this.design.equipment.category!),
      { relations: [{ relName: "design", relProps: ["equipment"] }] },
    );
  }

  get isCivilian(): boolean {
    return this.computed(
      "isCivilian",
      () =>
        [
          "equipmentCategory:settler",
          "equipmentCategory:trader",
          "equipmentCategory:worker",
        ].includes(this.design.equipment.category!),
      {
        relations: [{ relName: "design", relProps: ["equipment"] }],
      },
    );
  }

  get isMilitary(): boolean {
    return this.computed("isMilitary", () => !this.isAgent && !this.isCivilian, {
      relations: [{ relName: "design", relProps: ["equipment"] }],
    });
  }

  get myTypes(): Set<TypeObject> {
    return this.computed(
      "myTypes",
      () => new Set([this.concept, this.design.platform, this.design.equipment]),
      { relations: [{ relName: "design", relProps: ["platform", "equipment"] }] },
    );
  }

  get name(): string {
    return this.computed("name", () => this.customName || this.design.name, {
      props: ["customName"],
      relations: [{ relName: "design", relProps: ["name"] }],
    });
  }

  get types(): Set<TypeObject> {
    return this.computed(
      "types",
      () => new Set([this.concept, ...this.design.types, ...this.tile.types]),
      {
        relations: [
          { relName: "design", relProps: ["types"] },
          { relName: "tile", relProps: ["types"] },
        ],
      },
    );
  }

  get visibleTileKeys(): Set<GameKey> {
    return this.computed(
      "visibleTileKeys",
      () => {
        const store = useDataBucket();
        const center = getCoordsFromTileKey(this.tileKey);
        const neighbors = getHexNeighborCoords(store.world.size, center, 2);
        const keys = new Set<GameKey>();
        keys.add(this.tileKey);
        for (const c of neighbors) {
          keys.add(tileKey(c.x, c.y));
        }
        return keys;
      },
      { props: ["tileKey"] },
    );
  }

  get vitals(): Yields {
    return this.computed(
      "vitals",
      () =>
        new Yields([
          {
            type: "yieldType:health",
            amount: this.health,
            method: "lump",
            for: new Set(),
            vs: new Set(),
            max: 100,
          } as Yield,
          {
            type: "yieldType:moves",
            amount: this.movement.moves,
            method: "lump",
            for: new Set(),
            vs: new Set(),
            max: this.movement.maxMoves,
          } as Yield,
        ]),
      {
        props: ["health"],
        relations: [{ relName: "movement", relProps: ["moves", "maxMoves"] }],
      },
    );
  }

  /*
   * Actions
   */
  get actions(): Set<TypeObject> {
    return this.computed(
      "actions",
      () => {
        return this.design.actions;
      },
      { relations: [{ relName: "design", relProps: ["actions"] }] },
    );
  }

  get availableActions(): Set<TypeObject> {
    return this.computed(
      "availableActions",
      () => {
        // todo filter available
        return this.actions;
      },
      { props: ["actions"] },
    );
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

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(unitYieldTypeKeys, this.types).all();
        };

        // Unit Yields are from Design + Tile + Actor YieldMods
        const yields = new Yields();
        yields.add(...this.design.yields.all());
        yields.add(...yieldsForMe(this.tile.yields));
        yields.add(...yieldsForMe(this.player.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      {
        relations: [
          { relName: "design", relProps: ["yields"] },
          { relName: "tile", relProps: ["yields"] },
          { relName: "player", relProps: ["yieldMods"] },
        ],
      },
    );
  }
}
