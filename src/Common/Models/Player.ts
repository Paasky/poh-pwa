import { canHaveOne, hasMany, hasOne } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { TypeStorage } from "@/Common/Objects/TypeStorage";
import { playerYieldTypeKeys, Yield, Yields } from "@/Common/Objects/Yields";
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
import { UnitMovement } from "@/Simulation/Movement/UnitMovement";
import { Construction } from "@/Common/Models/Construction";
import { Incident } from "@/Common/Models/Incident";

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
    hasMany<Incident>(this, "incidentKeys");
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

  incidentKeys = new Set<GameKey>();
  declare incidents: Incident[];

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

  get leader(): TypeObject {
    return this.culture.leader;
  }

  get visibleTileKeys(): Set<GameKey> {
    const keys = new Set<GameKey>(this.tileKeys);

    this.units.forEach((u) => u.visibleTileKeys.forEach((k) => keys.add(k)));
    return keys;
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

  ////// v0.1

  // Yield Mods for all the Models I own (they use these to calc their Yields)
  get yieldMods(): Yields {
    return this.computed(
      "_yieldMods",
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
      ["government", "research", "cultureKey", "religionKey", "cityKeys"],
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "_yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(playerYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
        };

        // Player Yields are:
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
      ["government", "research", "cultureKey", "religionKey", "dealKeys", "cityKeys", "unitKeys"],
    );
  }
}
