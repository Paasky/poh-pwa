import { TypeObject } from "@/Common/Objects/TypeObject";
import { TypeStorage } from "@/Common/Objects/TypeStorage";
import { playerYieldTypeKeys, Yield, Yields } from "@/Common/Static/Yields";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { UnitDesign } from "@/Common/Models/UnitDesign";
import type { City } from "@/Common/Models/City";
import type { Agenda } from "@/Common/Models/Agenda";
import type { Deal } from "@/Common/Models/Deal";
import type { Culture } from "@/Common/Models/Culture";
import { Government } from "@/Common/Models/Government";
import { Research } from "@/Common/Models/Research";
import type { Citizen } from "@/Common/Models/Citizen";
import type { Religion } from "@/Common/Models/Religion";
import type { Tile } from "@/Common/Models/Tile";
import type { TradeRoute } from "@/Common/Models/TradeRoute";
import type { Unit } from "@/Common/Models/Unit";
import { Diplomacy } from "@/Common/Objects/Diplomacy";
import { Construction } from "@/Common/Models/Construction";
import { Incident } from "@/Common/Models/Incident";

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
    return this.hasMany<Agenda>("agendaKeys");
  }

  citizenKeys = new Set<GameKey>();
  get citizens(): Map<GameKey, Citizen> {
    return this.hasMany<Citizen>("citizenKeys");
  }

  cityKeys = new Set<GameKey>();
  get cities(): Map<GameKey, City> {
    return this.hasMany<City>("cityKeys");
  }

  constructionKeys = new Set<GameKey>();
  get constructions(): Map<GameKey, Construction> {
    return this.hasMany<Construction>("constructionKeys");
  }

  get culture(): Culture {
    return this.hasOne<Culture>("cultureKey");
  }

  dealKeys = new Set<GameKey>();
  get deals(): Map<GameKey, Deal> {
    return this.hasMany<Deal>("dealKeys");
  }

  designKeys = new Set<GameKey>();
  get designs(): Map<GameKey, UnitDesign> {
    return this.hasMany<UnitDesign>("designKeys");
  }

  get diplomacy(): Diplomacy {
    return this.hasOne<Diplomacy>("diplomacyKey");
  }

  get government(): Government {
    return this.hasOne<Government>("governmentKey");
  }

  incidentKeys = new Set<GameKey>();
  get incidents(): Map<GameKey, Incident> {
    return this.hasMany<Incident>("incidentKeys");
  }

  get religion(): Religion | null {
    return this.canHaveOne<Religion>("religionKey");
  }

  get research(): Research {
    return this.hasOne<Research>("researchKey");
  }

  tileKeys = new Set<GameKey>();
  get tiles(): Map<GameKey, Tile> {
    return this.hasMany<Tile>("tileKeys");
  }

  tradeRouteKeys = new Set<GameKey>();
  get tradeRoutes(): Map<GameKey, TradeRoute> {
    return this.hasMany<TradeRoute>("tradeRouteKeys");
  }

  unitKeys = new Set<GameKey>();
  get units(): Map<GameKey, Unit> {
    return this.hasMany<Unit>("unitKeys");
  }

  get knownPlayers(): Map<GameKey, Player> {
    return this.hasMany<Player>("knownPlayerKeys");
  }
  get knownReligions(): Map<GameKey, Religion> {
    return this.hasMany<Religion>("knownReligionKeys");
  }
  get knownTiles(): Map<GameKey, Tile> {
    return this.hasMany<Tile>("knownTileKeys");
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
