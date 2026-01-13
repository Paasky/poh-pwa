import { GameKey, GameObjAttr, GameObject, generateKey } from "@/Common/Models/_GameModel";
import { Citizen } from "@/Common/Models/Citizen";
import type { Player } from "@/Common/Models/Player";
import type { Religion } from "@/Common/Models/Religion";
import type { Tile } from "@/Common/Models/Tile";
import type { TradeRoute } from "@/Common/Models/TradeRoute";
import { Unit } from "@/Common/Models/Unit";
import { useDataBucket } from "@/Data/useDataBucket";
import { Construction } from "@/Common/Models/Construction";
import { useEventStore } from "@/App/stores/eventStore";
import { getRandom } from "@/Common/Helpers/arrayTools";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { getNeighbors } from "@/Common/Helpers/mapTools";
import { ConstructionQueue, TrainingQueue } from "@/Common/Objects/Queues";
import { TypeStorage } from "@/Common/Objects/TypeStorage";
import { cityYieldTypeKeys, Yield, Yields } from "@/Common/Static/Objects/Yields";

export class City extends GameObject {
  constructor(
    key: GameKey,
    public playerKey: GameKey,
    public tileKey: GameKey,
    public name: string,
    public canAttack = false,
    public health = 100,
    public isCapital = false,
    public origPlayerKey: GameKey = playerKey,
  ) {
    super(key);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", related: { theirKeyAttr: "cityKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "cityKey", isOne: true } },
    { attrName: "name" },
    { attrName: "canAttack", isOptional: true },
    { attrName: "health", isOptional: true },
    { attrName: "isCapital", isOptional: true },
    { attrName: "origPlayerKey", isOptional: true },
  ];

  /*
   * Attributes
   */
  constructionQueue = new ConstructionQueue();
  storage = new TypeStorage();
  trainingQueue = new TrainingQueue();

  /*
   * Relations
   */
  citizenKeys = new Set<GameKey>();
  get citizens(): Map<GameKey, Citizen> {
    return this.hasMany<Citizen>("citizenKeys");
  }

  constructionKeys = new Set<GameKey>();
  get constructions(): Map<GameKey, Construction> {
    return this.hasMany<Construction>("constructionKeys");
  }

  holyCityForKeys = new Set<GameKey>();
  get holyCityFors(): Map<GameKey, Religion> {
    return this.hasMany<Religion>("holyCityForKeys");
  }

  get origPlayer(): Player {
    return this.hasOne<Player>("origPlayerKey");
  }

  get player(): Player {
    return this.hasOne<Player>("playerKey");
  }

  get tile(): Tile {
    return this.hasOne<Tile>("tileKey");
  }

  tradeRouteKeys = new Set<GameKey>();
  get tradeRoutes(): Map<GameKey, TradeRoute> {
    return this.hasMany<TradeRoute>("tradeRouteKeys");
  }

  unitKeys = new Set<GameKey>();
  get units(): Map<GameKey, Unit> {
    return this.hasMany<Unit>("unitKeys");
  }

  /*
   * Actions
   */
  get actions(): Set<TypeObject> {
    return this.computed(
      "actions",
      () => {
        return new Set<TypeObject>([useDataBucket().getType("actionType:bombard")]);
      },
      {},
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

  /*
   * Computed
   */

  get constructableTypes(): Set<TypeObject> {
    return useDataBucket().getClassTypes("buildingType");
  }

  get religions(): Map<GameKey, { count: number; religion: Religion }> {
    const religions = new Map<GameKey, { count: number; religion: Religion }>();
    this.citizens.forEach((citizen) => {
      if (citizen.religionKey && !religions.has(citizen.religionKey)) {
        const item = religions.get(citizen.religionKey);
        if (item) {
          item.count++;
        } else {
          religions.set(citizen.religionKey, { count: 1, religion: citizen.religion! });
        }
      }
    });

    return religions;
  }

  get tilesWithFreeCitizenSlots(): Tile[] {
    const possibleTiles = getNeighbors(
      useDataBucket().world.size,
      this.tile,
      useDataBucket().getTiles(),
      "hex",
      3,
    );

    return possibleTiles.filter(
      (tile) =>
        // Tile belongs to same Actor
        tile.playerKey === this.playerKey &&
        // Tile has free citizen slot(s)
        tile.freeCitizenSlotCount &&
        // Tile is not occupied by another city
        ![...tile.citizens.values()].some((citizen) => citizen.cityKey !== this.key),
    );
  }

  get trainableDesigns(): UnitDesign[] {
    return [...this.player.designs.values()];
  }

  // Total population derived from citizen count
  get pop(): number {
    return 25 + Math.round(Math.pow(this.citizens.size, 3.5));
  }

  get foodToGrow(): number {
    return Math.round((this.citizenKeys.size * 7) ** 1.2);
  }

  /*
   * Actions
   */
  startTurn(): void {
    // Load the yields from the end of the prev turn into storage
    this.storage.load(this.yields.toStorage().all());

    // If the city has enough food to grow, add a new Citizen
    if (this.storage.amount("yieldType:food") >= this.foodToGrow) {
      const policies = this.player.government.policies;
      useEventStore().readyCitizens.push(
        new Citizen(
          generateKey("citizen"),
          this.key,
          this.player.cultureKey,
          this.playerKey,
          this.tileKey,
          this.player.religionKey,
          getRandom(policies.size ? policies : [null]),
        ),
      );
      this.storage.take("yieldType:food", this.foodToGrow);
    }

    const halfProd = {
      type: "yieldType:production",
      amount: this.storage.takeAll("yieldType:production") / 2,
      method: "lump",
      for: new Set(),
      vs: new Set(),
    } as Yield;

    const constructed = this.constructionQueue.startTurn(halfProd, this.storage, this.yields);
    const trained = this.trainingQueue.startTurn(halfProd, this.storage, this.yields);

    if (constructed) {
      useEventStore().readyConstructions.push(constructed as Construction);
    }
    if (trained) {
      useEventStore().readyUnits.push(
        new Unit(generateKey("unit"), trained.key, this.playerKey, this.tileKey, this.key),
      );
    }
  }

  warmUp(): void {
    // todo
  }

  // Types I give to the Actor
  get typesForPlayer(): Set<TypeObject> {
    return this.computed(
      "typesForCity",
      () => {
        const types = new Set<TypeObject>([this.concept]);
        const processedTileKeys = new Set<GameKey>();
        this.citizens.forEach((citizen) => {
          if (processedTileKeys.has(citizen.tileKey)) return;
          citizen.typesForCity.forEach((type) => types.add(type));
          processedTileKeys.add(citizen.tileKey);
        });
        return types;
      },
      { props: ["citizenKeys"] },
    );
  }

  // Yield Mods for all my Citizens/Constructions/Tiles/Trade Routes (they use these to calc their Yields)
  get yieldMods(): Yields {
    return this.computed(
      "yieldMods",
      () => {
        const yieldMods = new Yields();

        // Helper to output the yield mods we want
        const mods = (yields: Yields): Yield[] => {
          const yieldList: Yield[] = [];
          yields.all().forEach((y) => {
            // Not for or vs anyone -> not a yield mod
            if (y.for.size + y.vs.size === 0) return;

            yieldList.push(y);
          });
          return yieldList;
        };

        // From Citizens
        this.citizens.forEach((citizen) =>
          citizen.typesForCity.forEach((type) => yieldMods.add(...mods(type.yields))),
        );

        // From Actor
        yieldMods.add(...mods(this.player.yieldMods));

        return yieldMods;
      },
      { props: ["citizenKeys", "playerKey"] },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const forMe = new Set<TypeObject>([
          this.concept,
          useDataBucket().getType("specialType:allCities"),
        ]);

        // Look for railroad/motorway/river tiles
        let hasRailroad = false;
        let hasRiver = false;
        if (
          this.tile.route?.key === "routeType:railroad" ||
          this.tile.route?.key === "routeType:motorway"
        ) {
          forMe.add(useDataBucket().getType("specialType:allCitiesWithRailroad"));
          hasRailroad = true;
        }
        if (this.tile.riverKey) {
          forMe.add(useDataBucket().getType("specialType:allCitiesWithRiver"));
          hasRiver = true;
        }

        if (!hasRailroad || !hasRiver) {
          this.tile.neighborTiles.forEach((tile) => {
            if (hasRailroad && hasRiver) return;

            if (
              !hasRailroad &&
              (tile.route?.key === "routeType:railroad" || tile.route?.key === "routeType:motorway")
            ) {
              forMe.add(useDataBucket().getType("specialType:allCitiesWithRailroad"));
              hasRailroad = true;
            }

            if (!hasRiver && tile.riverKey) {
              forMe.add(useDataBucket().getType("specialType:allCitiesWithRiver"));
              hasRiver = true;
            }
          });
        }

        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(cityYieldTypeKeys, forMe).all();
        };

        // City Yields are All Citizens + Actor Mods
        const yields = new Yields();
        this.citizens.forEach((citizen) => yields.add(...yieldsForMe(citizen.yields)));
        yields.add(...yieldsForMe(this.player.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      { props: ["citizenKeys", "playerKey"] },
    );
  }
}
