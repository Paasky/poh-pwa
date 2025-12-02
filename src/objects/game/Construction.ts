import { hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef, ref } from "vue";
import { Yield, Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { Citizen } from "@/objects/game/Citizen";
import type { Tile } from "@/objects/game/Tile";

export class Construction extends GameObject {
  constructor(key: GameKey, type: TypeObject, tileKey: GameKey, health = 100, progress = 0) {
    super(key);
    this.health.value = health;
    this.name = type.name;
    this.progress.value = progress;
    this.type = type;

    this.tileKey = tileKey;
    this.tile = hasOne<Tile>(this.tileKey, `${this.key}.tile`);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "type", attrNotRef: true, isTypeObj: true },
    {
      attrName: "tileKey",
      attrNotRef: true,
      related: { theirKeyAttr: "constructionKey", isOne: true },
    },
    { attrName: "health", isOptional: true },
    { attrName: "progress", isOptional: true },
  ];

  /*
   * Attributes
   */
  completedAtTurn = ref(null as number | null);
  health = ref(100);
  name: string;
  progress = ref(0);
  type: TypeObject; // buildingType/improvementType/nationalWonderType/worldWonderType

  /*
   * Relations
   */
  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany<Citizen>(this.citizenKeys, `${this.key}.citizens`);

  tileKey: GameKey;
  tile: ComputedRef<Tile>;

  /*
   * Computed
   */
  yields = computed(() => {
    // Is a Wonder or full health -> no yield changes
    if (
      this.type.class === "nationalWonderType" ||
      this.type.class === "worldWonderType" ||
      this.health.value >= 100
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
          amount: this.health.value - 100,
        });
      }
    }
    return new Yields(yields);
  });

  /*
   * Actions
   */
  // todo add here
}
