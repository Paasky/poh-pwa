import { hasMany, hasOne } from "@/Common/Models/_Relations";
import { ConstructionQueue, TrainingQueue } from "@/Common/Objects/Queues";
import { TypeStorage } from "@/Common/Objects/TypeStorage";
import { Yield, Yields } from "@/Common/Objects/Yields";
import { GameKey, GameObjAttr, GameObject, generateKey } from "@/Common/Models/_GameModel";
import { Citizen } from "@/Common/Models/Citizen";
import type { Player } from "@/Common/Models/Player";
import type { Religion } from "@/Common/Models/Religion";
import type { Tile } from "@/Common/Models/Tile";
import type { TradeRoute } from "@/Common/Models/TradeRoute";
import { Unit } from "@/Common/Models/Unit";
import { useDataBucket } from "@/Data/useDataBucket";
import { Construction } from "@/Common/Models/Construction";
import { useEventStore } from "@/stores/eventStore";
import { getRandom } from "@/helpers/arrayTools";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { getNeighbors } from "@/helpers/mapTools";

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

    hasOne<Player>(this, "origPlayerKey");
    hasOne<Player>(this, "playerKey");
    hasOne<Tile>(this, "tileKey");

    hasMany<Citizen>(this, "citizenKeys");
    hasMany<Construction>(this, "constructionKeys");
    hasMany<Religion>(this, "holyCityForKeys");
    hasMany<TradeRoute>(this, "tradeRouteKeys");
    hasMany<Unit>(this, "unitKeys");
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
  declare citizens: Citizen[];

  constructionKeys = new Set<GameKey>();
  declare constructions: Construction[];

  holyCityForKeys = new Set<GameKey>();
  declare holyCityFors: Religion[];

  declare origPlayer: Player;

  declare player: Player;

  declare tile: Tile;

  tradeRouteKeys = new Set<GameKey>();
  declare tradeRoutes: TradeRoute[];

  unitKeys = new Set<GameKey>();
  declare units: Unit[];

  /*
   * Computed
   */
  get citizenYields(): Yields {
    const inherit = this.concept.inheritYieldTypes!;
    return new Yields(this.citizens.flatMap((c) => c.yields.only(inherit).all()));
  }

  get constructableTypes(): TypeObject[] {
    return Array.from(useDataBucket().getClassTypes("buildingType"));
  }

  get ownedTypes(): TypeObject[] {
    const types = new Set<TypeObject>();
    for (const citizen of this.citizens) {
      if (citizen.tile.naturalWonder) {
        types.add(citizen.tile.naturalWonder);
      }
      if (citizen.work?.isActive) {
        if (
          citizen.work.type.class === "buildingType" ||
          citizen.work.type.class === "nationalWonderType" ||
          citizen.work.type.class === "worldWonderType"
        ) {
          types.add(citizen.work.type);
        }
      }
    }
    return Array.from(types);
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
        // Tile belongs to same Player
        tile.playerKey === this.playerKey &&
        // Tile has free citizen slot(s)
        tile.freeCitizenSlotCount &&
        // Tile is not occupied by another city
        !tile.citizens.some((citizen) => citizen.cityKey !== this.key),
    );
  }

  get tileYields(): Yields {
    return this.tile.yields.only(this.concept.inheritYieldTypes!, [this.concept]);
  }

  get trainableDesigns(): UnitDesign[] {
    return this.player.designs;
  }

  get types(): TypeObject[] {
    return [this.concept, useDataBucket().getType("conceptType:urban")];
  }

  get yields(): Yields {
    return new Yields([...this.tileYields.all(), ...this.citizenYields.all()]).flatten();
  }

  // Total population derived from citizen count
  get pop(): number {
    return 25 + Math.round(Math.pow(this.citizens.length, 3.5));
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
          getRandom(policies.length ? policies : [null]),
        ),
      );
      this.storage.take("yieldType:food", this.foodToGrow);
    }

    const halfProd = {
      type: "yieldType:production",
      amount: this.storage.takeAll("yieldType:production") / 2,
      method: "lump",
      for: [],
      vs: [],
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
}
