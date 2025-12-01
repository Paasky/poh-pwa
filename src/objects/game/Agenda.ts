import { computed } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { Player } from "@/objects/game/Player";

export class Agenda extends GameObject {
  constructor(key: GameKey, playerKey: GameKey) {
    super(key);
    this.playerKey = playerKey;
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", attrNotRef: true, related: { theirKeyAttr: "agendaKeys" } },
  ];

  playerKey: GameKey;
  player = computed(() => useObjectsStore().get(this.playerKey) as Player);
}
