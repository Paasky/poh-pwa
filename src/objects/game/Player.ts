import { canHaveOne, hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { TypeStorage } from "@/objects/storage";
import { Yield, Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { UnitDesign } from "@/objects/game/UnitDesign";
import type { City } from "@/objects/game/City";
import type { Agenda } from "@/objects/game/Agenda";
import type { Deal } from "@/objects/game/Deal";
import type { Culture } from "@/objects/game/Culture";
import { Government } from "@/objects/player/Government";
import { Research } from "@/objects/player/Research";
import type { Citizen } from "@/objects/game/Citizen";
import type { Religion } from "@/objects/game/Religion";
import type { Tile } from "@/objects/game/Tile";
import type { TradeRoute } from "@/objects/game/TradeRoute";
import type { Unit } from "@/objects/game/Unit";
import { Diplomacy } from "@/objects/player/Diplomacy";
import { ObjKey, TypeKey } from "@/types/common";
import { useObjectsStore } from "@/stores/objectStore";
import { UnitMovement } from "@/movement/UnitMovement";
import { Construction } from "@/objects/game/Construction";

export class Player extends GameObject {
  constructor(
    key: GameKey,
    public cultureKey: GameKey,
    public name: string,
    public isCurrent = false,
    public isMinor = false,
    public religionKey: GameKey | null = null,
    public knownPlayerKeys = new Set<GameKey>(),
    public knownReligionKeys = new Set<GameKey>(),
    public knownTileKeys = new Set<GameKey>(),
  ) {
    super(key);

    this.diplomacy = new Diplomacy(key);
    this.government = new Government(key);
    this.research = new Research(key);

    hasOne<Culture>(this, "cultureKey");
    canHaveOne<Religion>(this, "religionKey");
    hasMany<Player>(this, "knownPlayerKeys");
    hasMany<Religion>(this, "knownReligionKeys");
    hasMany<Tile>(this, "knownTileKeys");

    this.agendaKeys = [];
    hasMany<Agenda>(this, "agendaKeys");
    this.citizenKeys = [];
    hasMany<Citizen>(this, "citizenKeys");
    this.cityKeys = [];
    hasMany<City>(this, "cityKeys");
    this.constructionKeys = [];
    hasMany<Construction>(this, "constructionKeys");
    this.dealKeys = [];
    hasMany<Deal>(this, "dealKeys");
    this.tileKeys = [];
    hasMany<Tile>(this, "tileKeys");
    this.tradeRouteKeys = [];
    hasMany<TradeRoute>(this, "tradeRouteKeys");
    this.unitKeys = [];
    hasMany<Unit>(this, "unitKeys");
    this.designKeys = [];
    hasMany<UnitDesign>(this, "designKeys");
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "cultureKey",
      related: { theirKeyAttr: "playerKey", isOne: true },
    },
    { attrName: "name" },
    { attrName: "isCurrent", isOptional: true },
    { attrName: "isMinor", isOptional: true },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "playerKeys" },
    },
    {
      attrName: "knownTileKeys",
      isOptional: true,
    },
  ];

  /*
   * Attributes
   */
  diplomacy: Diplomacy;
  government: Government;
  research: Research;
  storage = new TypeStorage();

  /*
   * Relations
   */
  agendaKeys: GameKey[];
  declare agendas: Agenda[];

  citizenKeys: GameKey[];
  declare citizens: Citizen[];

  cityKeys: GameKey[];
  declare cities: City[];

  constructionKeys: GameKey[];
  declare constructions: Construction[];

  declare culture: Culture;

  dealKeys: GameKey[];
  declare deals: Deal[];

  declare religion: Religion | null;

  tileKeys: GameKey[];
  declare tiles: Tile[];

  tradeRouteKeys: GameKey[];
  declare tradeRoutes: TradeRoute[];

  unitKeys: GameKey[];
  declare units: Unit[];

  designKeys: GameKey[];
  declare designs: UnitDesign[];

  /*
   * Computed
   */
  get activeDesigns(): UnitDesign[] {
    return this.designs.filter((d) => d.isActive);
  }

  get citizenTypes(): TypeObject[] {
    return [
      ...this.culture.heritages,
      ...this.culture.traits,
      ...(this.religion?.myths ?? []),
      ...(this.religion?.gods ?? []),
      ...(this.religion?.dogmas ?? []),
    ] as TypeObject[];
  }

  get commonTypes(): TypeObject[] {
    return [...this.government.policies, ...this.research.researched] as TypeObject[];
  }

  // All specials from all known types
  get knownSpecialKeys(): Set<TypeKey> {
    return new Set(this.knownTypes.flatMap((t) => t.specials));
  }

  // All 3 types-arrays combined
  get knownTypes(): TypeObject[] {
    return [...this.citizenTypes, ...this.commonTypes, ...this.ownedTypes];
  }

  get leader(): TypeObject {
    return this.culture.leader;
  }

  get ownedTypes(): TypeObject[] {
    return this.cities.flatMap((city) => city.ownedTypes);
  }

  get visibleTileKeys(): Set<GameKey> {
    const keys = new Set<GameKey>(this.tileKeys);

    // Prevent crash if store is not ready yet
    if (!useObjectsStore().ready) return keys;

    this.units.forEach((u) => u.visibleTileKeys.forEach((k) => keys.add(k)));
    return keys;
  }

  // Player yield mods are the combined nation-wide yield for/vs
  get yieldMods(): Yields {
    const yieldMods = new Yields();

    // Add any Common Type yield that is for/vs (aka is a yield mod)
    for (const type of this.commonTypes) {
      for (const y of type.yields.all()) {
        if (y.for.length + y.vs.length > 0) {
          yieldMods.add(y);
        }
      }
    }

    // Add any Culture/Religion Type yield that is for/vs AND NOT for Citizens
    for (const type of this.citizenTypes) {
      for (const y of type.yields.all()) {
        const forOthers = y.for.filter((forKey: ObjKey) => forKey !== "conceptType:citizen");

        // Does it have any mods we can use?
        if (forOthers.length + y.vs.length > 0) {
          yieldMods.add({
            type: y.type,
            amount: y.amount,
            method: y.method,
            for: forOthers,
            vs: y.vs,
          } as Yield);
        }
      }
    }

    // Add any Owned Type yields that is for/vs a specialType
    for (const type of this.ownedTypes) {
      for (const y of type.yields.all()) {
        const forSpecials = y.for.filter((forKey: ObjKey) => forKey.startsWith("specialType:"));
        const vsSpecials = y.for.filter((forKey: ObjKey) => forKey.startsWith("specialType:"));

        // Does it have any mods we can use?
        if (forSpecials.length + vsSpecials.length > 0) {
          yieldMods.add({
            type: y.type,
            amount: y.amount,
            method: y.method,
            for: forSpecials,
            vs: vsSpecials,
          } as Yield);
        }
      }
    }

    return yieldMods;
  }

  // Player yields is the total lump output (+/-) of all Cities, Deals and Units
  get yields(): Yields {
    const yields = new Yields();
    const inheritYieldTypes = [
      "yieldType:culture",
      "yieldType:faith",
      "yieldType:gold",
      "yieldType:influence",
      "yieldType:science",
      "yieldType:upkeep",
    ] as TypeKey[];

    const inheritFromGameObjs = [...this.cities, ...this.deals, ...this.units] as (
      | City
      | Deal
      | Unit
    )[];

    for (const gameObj of inheritFromGameObjs) {
      for (const y of gameObj.yields.applyMods().all()) {
        if (
          y.amount &&
          y.method === "lump" &&
          y.for.length + y.vs.length === 0 &&
          inheritYieldTypes.includes(y.type)
        ) {
          yields.add({
            type: y.type,
            amount: y.amount,
            method: y.method,
            for: [],
            vs: [],
          } as Yield);
        }
      }
    }

    return yields;
  }

  /*
   * Actions
   */
  startTurn(): void {
    // Load the yields from the end of the prev turn into storage
    this.storage.load(this.yields.toStorage().all());

    this.cities.forEach((c) => c.startTurn());
    this.units.forEach((u) => u.startTurn());

    this.culture.startTurn();
    this.diplomacy.startTurn();
    this.government.startTurn();
    this.religion?.startTurn();
    this.research.startTurn();
  }

  endTurn(): boolean {
    // Try to move remaining auto-moves (units on multi-turn move + units on trade routes)
    // On refusal, return false
    // After all done, return true
    for (const unit of this.units) {
      if (unit.movement.move(UnitMovement.getMoveContext(unit)) === false) return false;
    }
    return true;
  }

  warmUp(): void {
    this.agendas;
    this.citizens;
    this.culture;
    this.cities;
    this.deals;
    this.designs;
    this.knownTileKeys;
    this.knownTypes;
    this.religion;
    this.knownSpecialKeys;
    // this.tiles; // Player doesn't have tiles relation anymore it seems
    this.tradeRoutes;
    this.units;
    this.visibleTileKeys;

    this.activeDesigns;
    this.leader;
    this.commonTypes;
    this.citizenTypes;
    this.ownedTypes;
    this.yieldMods;
    this.yields;
  }
}
