/* eslint-disable @typescript-eslint/no-explicit-any */
import { canHaveOne, hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef, ref } from "vue";
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
    type: TypeObject,
    tileKey: GameKey,
    cityKey?: GameKey,
    health = 100,
    progress = 0,
  ) {
    super(key);
    this.health.value = health;
    this.name = type.name;
    this.progress.value = progress;
    this.type = type;

    this.cityKey = cityKey ?? null;
    this.city = canHaveOne<City>(this.cityKey, `${this.key}.city`);

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
    {
      isOptional: true,
      attrName: "cityKey",
      attrNotRef: true,
      related: { theirKeyAttr: "constructionKeys" },
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

  cityKey: GameKey | null;
  city: ComputedRef<City | null>;

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
  abandon(reason: string): void {
    this.health.value = 0;
    this.tile.value.citizens.value.forEach((c) => c.pickTile());

    // Use any as IDE has a Ref value mismatch
    useEventStore().turnEvents.push(new ConstructionAbandoned(this, reason) as any);
  }

  complete(player: Player): void {
    this.completedAtTurn.value = useObjectsStore().world.turn;
    this.progress.value = 100;

    // Use any as IDE has a Ref value mismatch
    useEventStore().turnEvents.push(new ConstructionCompleted(this, player) as any);
  }

  cancel(player: Player, wasLost: boolean): void {
    if (this.city.value) {
      this.city.value.constructionKeys.value = this.city.value.constructionKeys.value.filter(
        (k) => k !== this.key,
      );
    }
    this.tile.value.constructionKey.value = null;

    delete useObjectsStore()._gameObjects[this.key];

    if (wasLost) {
      // Use any as IDE has a Ref value mismatch
      useEventStore().turnEvents.push(
        new ConstructionLost(this.type, player, this.tile.value, this.city.value) as any,
      );
    } else {
      // Use any as IDE has a Ref value mismatch
      useEventStore().turnEvents.push(
        new ConstructionCancelled(this.type, player, this.tile.value, this.city.value) as any,
      );
    }
  }
}
