import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { computed } from "vue";
import { Player } from "@/objects/game/Player";
import { useObjectsStore } from "@/stores/objectStore";

export class Deal extends GameObject {
  constructor(key: GameKey, fromPlayerKey: GameKey, toPlayerKey: GameKey) {
    super(key);
    this.fromPlayerKey = fromPlayerKey;
    this.toPlayerKey = toPlayerKey;
  }

  fromPlayerKey = "" as GameKey;
  fromPlayer = computed(
    () => useObjectsStore().get(this.fromPlayerKey) as Player,
  );

  toPlayerKey = "" as GameKey;
  toPlayer = computed(() => useObjectsStore().get(this.toPlayerKey) as Player);

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
}
