import { TypeObject } from "@/Common/Objects/TypeObject";
import { constructionYieldTypeKeys, Yield, Yields } from "@/Common/Static/Yields";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Citizen } from "@/Common/Models/Citizen";
import type { Tile } from "@/Common/Models/Tile";
import { City } from "@/Common/Models/City";
import { useDataBucket } from "@/Data/useDataBucket";
import { useEventStore } from "@/App/stores/eventStore";
import {
  ConstructionAbandoned,
  ConstructionCancelled,
  ConstructionCompleted,
  ConstructionLost,
} from "@/Common/events/Construction";
import { Player } from "@/Common/Models/Player";

export class Construction extends GameObject {
  constructor(
    key: GameKey,
    public type: TypeObject,
    public tileKey: GameKey,
    public cityKey: GameKey | null = null,
    public health = 100,
    public progress = 0,
    public completedAtTurn: number | null = null,
  ) {
    super(key);
    this.name = this.type.name;
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
  get citizens(): Map<GameKey, Citizen> {
    return this.hasMany<Citizen>("citizenKeys");
  }

  get city(): City | null {
    return this.canHaveOne<City>("cityKey");
  }

  get tile(): Tile {
    return this.hasOne<Tile>("tileKey");
  }

  /*
   * Computed
   */
  get isActive(): boolean {
    return this.progress === 100 && this.health > 0;
  }

  get types(): Set<TypeObject> {
    return this.computed(
      "types",
      () => {
        const types = new Set<TypeObject>([this.concept]);
        if (this.progress < 100) return types;

        types.add(this.type);

        if (
          this.type.class === "buildingType" ||
          this.type.class === "nationalWonderType" ||
          this.type.class === "worldWonderType"
        ) {
          types.add(useDataBucket().getType("conceptType:urban"));
        }

        return types;
      },
      { props: ["progress", "type"] },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        // Must be completed and be alive to grant yields
        if (this.progress < 100 || this.health <= 0) return new Yields();
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(constructionYieldTypeKeys, this.types).all();
        };

        // Construction Yields are from my Types + City Mods
        const yields = new Yields();
        this.types.forEach((type) => yields.add(...yieldsForMe(type.yields)));
        if (this.city) yields.add(...yieldsForMe(this.city.yieldMods));

        // Flatten Yields to apply modifiers
        const flatYields = yields.flatten();

        // Full health -> no yield changes
        if (this.health >= 100) return flatYields;

        // Construction is damaged -> reduce Yields
        const damageYields = [] as Yield[];
        for (const y of this.type.yields.all()) {
          // Include the original yield
          damageYields.push(y);

          // If it's a lump yield, add a -health% modifier
          if (y.method === "lump") {
            damageYields.push({
              ...y,
              method: "percent",
              amount: this.health - 100,
            });
          }
        }
        return new Yields(damageYields).flatten();
      },
      {
        props: ["health", "progress", "type"],
        relations: [{ relName: "city", relProps: ["yieldMods"] }],
      },
    );
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
    this.completedAtTurn = useDataBucket().world.turn;
    this.progress = 100;

    useEventStore().turnEvents.push(new ConstructionCompleted(this, player));
  }

  cancel(player: Player, wasLost: boolean): void {
    if (this.city) {
      this.city.constructionKeys.delete(this.key);
    }
    this.tile.constructionKey = null;

    delete useDataBucket()._gameObjects[this.key];

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
