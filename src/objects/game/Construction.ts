import { HasCitizens, HasTile } from "@/objects/game/_mixins";
import { TypeObject } from "@/types/typeObjects";
import { computed, ref } from "vue";
import { Yield, Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";

export class Construction extends HasCitizens(HasTile(GameObject)) {
  constructor(
    key: GameKey,
    type: TypeObject,
    tileKey: GameKey,
    health = 100,
    progress = 0,
  ) {
    super(key);
    this.type = type;
    this.tileKey.value = tileKey;
    this.name = type.name;
    this.types = [type];
    this.health.value = health;
    this.progress.value = progress;
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "type", attrNotRef: true, isTypeObj: true },
    {
      attrName: "tileKey",
      related: { theirKeyAttr: "constructionKey", isOne: true },
    },
    { attrName: "health", isOptional: true },
    { attrName: "progress", isOptional: true },
  ];

  type: TypeObject; // buildingType/improvementType/nationalWonderType/worldWonderType
  name: string;
  health = ref(100);
  progress = ref(0);
  completedAtTurn = ref(null as number | null);

  types: TypeObject[];
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
}
