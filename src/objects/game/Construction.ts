import { canHaveOne, hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { Yield, Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { Citizen } from "@/objects/game/Citizen";
import type { Tile } from "@/objects/game/Tile";
import { City } from "@/objects/game/City";
import { useObjectsStore } from "@/stores/objectStore";
import { useEventStore } from "@/stores/eventStore";
import {
  ConstructionAbandoned,
  ConstructionCancelled,
  ConstructionCompleted,
  ConstructionLost,
} from "@/events/Construction";
import { Player } from "@/objects/game/Player";

export class Construction extends GameObject {
  constructor(
    key: GameKey,
    public type: TypeObject,
    public tileKey: GameKey,
    public cityKey: GameKey | null = null,
    public health = 100,
    public progress = 0,
  ) {
    super(key);
    this.name = this.type.name;

    canHaveOne<City>(this, "cityKey");
    hasOne<Tile>(this, "tileKey");

    hasMany<Citizen>(this, "citizenKeys");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "type", isTypeObj: true },
    {
      attrName: "tileKey",
      related: { theirKeyAttr: "constructionKey", isOne: true },
    },
    {
      isOptional: true,
      attrName: "cityKey",
      related: { theirKeyAttr: "constructionKeys" },
    },
    { attrName: "health", isOptional: true },
    { attrName: "progress", isOptional: true },
  ];

  /*
   * Attributes
   */
  completedAtTurn: number | null = null;
  name: string;

  /*
   * Relations
   */
  citizenKeys = new Set<GameKey>();
  declare citizens: Citizen[];

  declare city: City | null;

  declare tile: Tile;

  /*
   * Computed
   */
  get isActive(): boolean {
    return this.progress === 100 && this.health > 0;
  }

  get yields(): Yields {
    // Is a Wonder or full health -> no yield changes
    if (
      this.type.class === "nationalWonderType" ||
      this.type.class === "worldWonderType" ||
      this.health >= 100
    ) {
      return this.type.yields;
    }

    const yields = [] as Yield[];
    for (const y of this.type.yields.all()) {
      // Include the original yield
      yields.push(y);

      // If it's a lump yield, add a -health% modifier
      if (y.method === "lump") {
        yields.push({
          ...y,
          method: "percent",
          amount: this.health - 100,
        });
      }
    }
    return new Yields(yields);
  }

  /*
   * Actions
   */
  abandon(reason: string): void {
    this.health = 0;
    this.tile.citizens.forEach((c) => c.pickTile());

    useEventStore().turnEvents.push(new ConstructionAbandoned(this, reason));
  }

  complete(player: Player): void {
    this.completedAtTurn = useObjectsStore().world.turn;
    this.progress = 100;

    useEventStore().turnEvents.push(new ConstructionCompleted(this, player));
  }

  cancel(player: Player, wasLost: boolean): void {
    if (this.city) {
      this.city.constructionKeys.delete(this.key);
    }
    this.tile.constructionKey = null;

    delete useObjectsStore()._gameObjects[this.key];

    if (wasLost) {
      useEventStore().turnEvents.push(
        new ConstructionLost(this.type, player, this.tile, this.city),
      );
    } else {
      useEventStore().turnEvents.push(
        new ConstructionCancelled(this.type, player, this.tile, this.city),
      );
    }
  }
}
