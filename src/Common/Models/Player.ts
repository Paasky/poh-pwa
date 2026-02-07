import { TypeObject } from "../Static/Objects/TypeObject";
import { TypeStorage } from "../Objects/TypeStorage";
import { playerYieldTypeKeys, Yield, Yields } from "../Static/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import type { UnitDesign } from "./UnitDesign";
import type { City } from "./City";
import type { Agenda } from "./Agenda";
import type { Deal } from "./Deal";
import type { Culture } from "./Culture";
import { Government } from "./Government";
import { Research } from "./Research";
import type { Citizen } from "./Citizen";
import type { Religion } from "./Religion";
import type { Tile } from "./Tile";
import type { TradeRoute } from "./TradeRoute";
import type { Unit } from "./Unit";
import { Diplomacy } from "../Objects/Diplomacy";
import { Construction } from "./Construction";
import { Incident } from "./Incident";
import { useDataBucket } from "@/Data/useDataBucket";

export interface WonderState {
  completed: Set<TypeObject>;
  underConstruction: Set<TypeObject>;
  available: Set<TypeObject>;
}

export class Player extends GameObject {
  constructor(
    key: GameKey,
    public cultureKey: GameKey,
    public diplomacyKey: GameKey,
    public governmentKey: GameKey,
    public researchKey: GameKey,
    public userName?: string,
    public isHuman = false,
    public isCurrent = false,
    public isMinor = false,
    public religionKey: GameKey | null = null,
    public knownPlayerKeys = new Set<GameKey>(),
    public knownReligionKeys = new Set<GameKey>(),
    public knownTileKeys = new Set<GameKey>(),
  ) {
    super(key);
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "cultureKey",
      related: { theirKeyAttr: "playerKey", isOne: true },
    },
    {
      attrName: "diplomacyKey",
      related: { theirKeyAttr: "playerKey", isOne: true },
    },
    {
      attrName: "governmentKey",
      related: { theirKeyAttr: "playerKey", isOne: true },
    },
    {
      attrName: "researchKey",
      related: { theirKeyAttr: "playerKey", isOne: true },
    },
    { attrName: "userName", isOptional: true },
    { attrName: "isHuman", isOptional: true },
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
  storage = new TypeStorage();

  /*
   * Relations
   */

  agendaKeys = new Set<GameKey>();
  get agendas(): Map<GameKey, Agenda> {
    return this.hasMany<Agenda>("agendas", "agendaKeys");
  }

  citizenKeys = new Set<GameKey>();
  get citizens(): Map<GameKey, Citizen> {
    return this.hasMany<Citizen>("citizens", "citizenKeys");
  }

  cityKeys = new Set<GameKey>();
  get cities(): Map<GameKey, City> {
    return this.hasMany<City>("cities", "cityKeys");
  }

  constructionKeys = new Set<GameKey>();
  get constructions(): Map<GameKey, Construction> {
    return this.hasMany<Construction>("constructions", "constructionKeys");
  }

  get culture(): Culture {
    return this.hasOne<Culture>("culture", "cultureKey");
  }

  dealKeys = new Set<GameKey>();
  get deals(): Map<GameKey, Deal> {
    return this.hasMany<Deal>("deals", "dealKeys");
  }

  designKeys = new Set<GameKey>();
  get designs(): Map<GameKey, UnitDesign> {
    return this.hasMany<UnitDesign>("designs", "designKeys");
  }

  get diplomacy(): Diplomacy {
    return this.hasOne<Diplomacy>("diplomacy", "diplomacyKey");
  }

  get government(): Government {
    return this.hasOne<Government>("government", "governmentKey");
  }

  incidentKeys = new Set<GameKey>();
  get incidents(): Map<GameKey, Incident> {
    return this.hasMany<Incident>("incidents", "incidentKeys");
  }

  get religion(): Religion | null {
    return this.canHaveOne<Religion>("religion", "religionKey");
  }

  get research(): Research {
    return this.hasOne<Research>("research", "researchKey");
  }

  tileKeys = new Set<GameKey>();
  get tiles(): Map<GameKey, Tile> {
    return this.hasMany<Tile>("tiles", "tileKeys");
  }

  tradeRouteKeys = new Set<GameKey>();
  get tradeRoutes(): Map<GameKey, TradeRoute> {
    return this.hasMany<TradeRoute>("tradeRoutes", "tradeRouteKeys");
  }

  unitKeys = new Set<GameKey>();
  get units(): Map<GameKey, Unit> {
    return this.hasMany<Unit>("units", "unitKeys");
  }

  get knownPlayers(): Map<GameKey, Player> {
    return this.hasMany<Player>("knownPlayers", "knownPlayerKeys");
  }
  get knownReligions(): Map<GameKey, Religion> {
    return this.hasMany<Religion>("knownReligions", "knownReligionKeys");
  }
  get knownTiles(): Map<GameKey, Tile> {
    return this.hasMany<Tile>("knownTiles", "knownTileKeys");
  }

  /*
   * Computed
   */

  get leader(): TypeObject {
    return this.culture.leader;
  }

  get name(): string {
    return this.computed(
      "name",
      () => {
        const userName = this.userName || (this.isHuman ? "Human" : "AI");
        return `${this.leader.name} - ${this.culture.type.name} [${userName}]`;
      },
      {
        props: ["userName", "isHuman"],
        relations: [{ relName: "culture", relProps: ["type"] }],
      },
    );
  }

  get visibleTileKeys(): Set<GameKey> {
    return this.computed(
      "visibleTileKeys",
      () => {
        const keys = new Set<GameKey>(this.tileKeys);

        this.units.forEach((u) => u.visibleTileKeys.forEach((k) => keys.add(k)));
        return keys;
      },
      {
        props: ["tileKeys"],
        relations: [{ relName: "units", relProps: ["visibleTileKeys"] }],
      },
    );
  }

  /*
   * Actions
   */

  warmUp(): void {
    // todo warm up computed fields by calling them
  }

  /*
   * Wonder Tracking
   */

  get nationalWonderState(): WonderState {
    return this.computed(
      "nationalWonderState",
      () => {
        const completed = new Set<TypeObject>();
        const underConstruction = new Set<TypeObject>();

        for (const construction of this.constructions.values()) {
          if (construction.type.class !== "nationalWonderType") continue;
          if (construction.completedAtTurn !== null) {
            completed.add(construction.type);
          } else {
            underConstruction.add(construction.type);
          }
        }

        const available = new Set<TypeObject>();
        for (const type of useDataBucket().getClassTypes("nationalWonderType")) {
          if (completed.has(type) || underConstruction.has(type)) continue;
          if (!this.research.researched.has(type)) continue;
          if (!type.requires.isEmpty && !type.requires.isSatisfied(this.types)) continue;
          available.add(type);
        }

        return { completed, underConstruction, available };
      },
      {
        relations: [
          { relName: "constructions", relProps: ["type", "completedAtTurn"] },
          { relName: "research", relProps: ["researched"] },
        ],
      },
    );
  }

  get worldWonderState(): WonderState {
    return this.computed(
      "worldWonderState",
      () => {
        const completed = new Set<TypeObject>();
        const underConstruction = new Set<TypeObject>();

        for (const construction of this.constructions.values()) {
          if (construction.type.class !== "worldWonderType") continue;
          if (construction.completedAtTurn !== null) {
            completed.add(construction.type);
          } else {
            underConstruction.add(construction.type);
          }
        }

        const available = new Set<TypeObject>();
        const wonders = useDataBucket().wonders;
        for (const type of useDataBucket().getClassTypes("worldWonderType")) {
          if (wonders.isClaimed(type.key)) continue;
          if (!this.research.researched.has(type)) continue;
          if (!type.requires.isEmpty && !type.requires.isSatisfied(this.types)) continue;
          available.add(type);
        }

        return { completed, underConstruction, available };
      },
      {
        relations: [
          { relName: "constructions", relProps: ["type", "completedAtTurn"] },
          { relName: "research", relProps: ["researched"] },
        ],
      },
    );
  }

  get completedNationalWonders(): Set<TypeObject> {
    return this.nationalWonderState.completed;
  }

  get underConstructionNationalWonders(): Set<TypeObject> {
    return this.nationalWonderState.underConstruction;
  }

  get availableNationalWonders(): Set<TypeObject> {
    return this.nationalWonderState.available;
  }

  get completedWorldWonders(): Set<TypeObject> {
    return this.worldWonderState.completed;
  }

  get underConstructionWorldWonders(): Set<TypeObject> {
    return this.worldWonderState.underConstruction;
  }

  get availableWorldWonders(): Set<TypeObject> {
    return this.worldWonderState.available;
  }

  ////// v0.1

  // Yield Mods for all the Models I own (they use these to calc their Yields)
  get yieldMods(): Yields {
    return this.computed(
      "yieldMods",
      () => {
        const yieldMods = new Yields();

        // Helper to output the yield mods we want
        const mods = (yields: Yields, purgeForCitizen = false): Yield[] => {
          const yieldList: Yield[] = [];
          yields.all().forEach((y) => {
            // Not for or vs anyone -> not a yield mod
            if (y.for.size + y.vs.size === 0) return;

            // If purging citizen mods & it's for citizens -> ignore
            if (purgeForCitizen && y.for.has("conceptType:citizen")) return;

            yieldList.push(y);
          });
          return yieldList;
        };

        // Government & Research are simple
        yieldMods.add(...mods(this.government.yields));
        yieldMods.add(...mods(this.research.yields));

        // Culture & Religion "for Citizen" ony affects Citizens who have that Culture/Religion
        // -> purgeForCitizen
        yieldMods.add(...mods(this.culture.yields, true));
        if (this.religion) yieldMods.add(...mods(this.religion.yields, true));

        // From Cities: only include yield mods that are for All Cities
        this.cities.forEach((city) => {
          city.yields.all().forEach((y) => {
            if (
              y.for.has("specialType:allCities") ||
              y.for.has("specialType:allCitiesWithRailroad") ||
              y.for.has("specialType:allCitiesWithRiver")
            ) {
              yieldMods.add(y);
            }
          });
        });

        return yieldMods;
      },
      {
        relations: [
          { relName: "government", relProps: ["yields"] },
          { relName: "research", relProps: ["yields"] },
          { relName: "culture", relProps: ["yields"] },
          { relName: "religion", relProps: ["yields"] },
          { relName: "cities", relProps: ["yields"] },
        ],
      },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(playerYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
        };

        // Actor Yields are:
        // Government + Research + Culture + Religion
        // + Agendas + Cities + Deals + Incidents + Trade Routes + Units
        const yields = new Yields();
        yields.add(...yieldsForMe(this.government.yields));
        yields.add(...yieldsForMe(this.research.yields));
        yields.add(...yieldsForMe(this.culture.yields));
        if (this.religion) yields.add(...yieldsForMe(this.religion.yields));

        this.agendas.forEach((agenda) => yields.add(...yieldsForMe(agenda.yields)));
        this.cities.forEach((city) => yields.add(...yieldsForMe(city.yields)));
        this.deals.forEach((deal) => yields.add(...yieldsForMe(deal.yields)));
        this.incidents.forEach((incident) => yields.add(...yieldsForMe(incident.yields)));
        this.tradeRoutes.forEach((tradeRoute) => yields.add(...yieldsForMe(tradeRoute.yields)));
        this.units.forEach((unit) => yields.add(...yieldsForMe(unit.yields)));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      {
        relations: [
          { relName: "government", relProps: ["yields"] },
          { relName: "research", relProps: ["yields"] },
          { relName: "culture", relProps: ["yields"] },
          { relName: "religion", relProps: ["yields"] },
          { relName: "agendas", relProps: ["yields"] },
          { relName: "cities", relProps: ["yields"] },
          { relName: "deals", relProps: ["yields"] },
          { relName: "incidents", relProps: ["yields"] },
          { relName: "tradeRoutes", relProps: ["yields"] },
          { relName: "units", relProps: ["yields"] },
        ],
      },
    );
  }
}
