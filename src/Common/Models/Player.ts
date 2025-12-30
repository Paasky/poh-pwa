import { canHaveOne, hasMany, hasOne } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { TypeStorage } from "@/Common/Objects/TypeStorage";
import { Yield, Yields } from "@/Common/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { UnitDesign } from "@/Common/Models/UnitDesign";
import type { City } from "@/Common/Models/City";
import type { Agenda } from "@/Common/Models/Agenda";
import type { Deal } from "@/Common/Models/Deal";
import type { Culture } from "@/Common/Models/Culture";
import { Government } from "@/Common/Objects/Government";
import { Research } from "@/Common/Objects/Research";
import type { Citizen } from "@/Common/Models/Citizen";
import type { Religion } from "@/Common/Models/Religion";
import type { Tile } from "@/Common/Models/Tile";
import type { TradeRoute } from "@/Common/Models/TradeRoute";
import type { Unit } from "@/Common/Models/Unit";
import { Diplomacy } from "@/Common/Objects/Diplomacy";
import { ObjKey, TypeKey } from "@/Common/Objects/Common";
import { useObjectsStore } from "@/stores/objectStore";
import { UnitMovement } from "@/Simulation/Movement/UnitMovement";
import { Construction } from "@/Common/Models/Construction";

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

    hasMany<Agenda>(this, "agendaKeys");
    hasMany<Citizen>(this, "citizenKeys");
    hasMany<City>(this, "cityKeys");
    hasMany<Construction>(this, "constructionKeys");
    hasMany<Deal>(this, "dealKeys");
    hasMany<Tile>(this, "tileKeys");
    hasMany<TradeRoute>(this, "tradeRouteKeys");
    hasMany<Unit>(this, "unitKeys");
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
      attrName: "knownPlayerKeys",
      isOptional: true,
      related: { theirKeyAttr: "knownPlayerKeys", isManyToMany: true },
    },
    {
      attrName: "knownReligionKeys",
      isOptional: true,
      related: { theirKeyAttr: "knownByPlayerKeys", isManyToMany: true },
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
  agendaKeys = new Set<GameKey>();
  declare agendas: Agenda[];

  citizenKeys = new Set<GameKey>();
  declare citizens: Citizen[];

  cityKeys = new Set<GameKey>();
  declare cities: City[];

  constructionKeys = new Set<GameKey>();
  declare constructions: Construction[];

  declare culture: Culture;

  dealKeys = new Set<GameKey>();
  declare deals: Deal[];

  declare religion: Religion | null;

  tileKeys = new Set<GameKey>();
  declare tiles: Tile[];

  tradeRouteKeys = new Set<GameKey>();
  declare tradeRoutes: TradeRoute[];

  declare knownPlayers: Player[];
  declare knownReligions: Religion[];
  declare knownTiles: Tile[];

  unitKeys = new Set<GameKey>();
  declare units: Unit[];

  designKeys = new Set<GameKey>();
  declare designs: UnitDesign[];

  /*
   * Computed
   */

  // types =
  // -> common types +
  // -> citizen types +
  // -> owned types +

  // citizen types =
  // -> culture heritages & traits +
  // -> state religion myths & gods & dogmas

  // common types =
  // -> government policies +
  // -> research researched +

  // owned types =
  // -> cities > citizens > work > types for/vs "all cities"

  get types(): TypeObject[] {
    return [...this.citizenTypes, ...this.commonTypes, ...this.ownedTypes];
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

  get ownedTypes(): TypeObject[] {
    return this.cities.flatMap((city) => city.ownedTypes);
  }

  get activeDesigns(): UnitDesign[] {
    return this.designs.filter((d) => d.isActive);
  }

  // All specials from all known types
  get knownSpecialKeys(): Set<TypeKey> {
    return new Set(this.types.flatMap((t) => t.specials));
  }

  get leader(): TypeObject {
    return this.culture.leader;
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
      for (const y of gameObj.yields.flatten().all()) {
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

  warmUp(): void {}
}
