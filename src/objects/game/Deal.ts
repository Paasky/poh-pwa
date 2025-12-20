import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { computed, ComputedRef } from "vue";
import type { Player } from "@/objects/game/Player";
import { hasOne } from "@/objects/game/_relations";
import { Yields } from "@/objects/yield";

export class Deal extends GameObject {
  constructor(key: GameKey, fromPlayerKey: GameKey, toPlayerKey: GameKey) {
    super(key);
    this.fromPlayerKey = fromPlayerKey;
    this.fromPlayer = hasOne<Player>(this.fromPlayerKey, `${this.key}.fromPlayer`);
    this.toPlayerKey = toPlayerKey;
    this.toPlayer = hasOne<Player>(this.toPlayerKey, `${this.key}.toPlayer`);
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "fromPlayerKey",
      attrNotRef: true,
      related: { theirKeyAttr: "dealKeys" },
    },
    {
      attrName: "toPlayerKey",
      attrNotRef: true,
      related: { theirKeyAttr: "dealKeys" },
    },
  ];

  /*
   * Attributes
   */
  // todo add here

  /*
   * Relations
   */
  fromPlayerKey = "" as GameKey;
  fromPlayer: ComputedRef<Player>;

  toPlayerKey = "" as GameKey;
  toPlayer: ComputedRef<Player>;

  /*
   * Computed
   */

  yields = computed(() => new Yields([]));

  /*
   * Actions
   */
  // todo add here
}
