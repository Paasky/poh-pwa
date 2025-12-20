import { computed } from "vue";
import { GameKey } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { Player } from "@/objects/game/Player";

export class Diplomacy {
  constructor(playerKey: GameKey) {
    this.playerKey = playerKey;
  }

  playerKey: GameKey;
  player = computed(() => useObjectsStore().get(this.playerKey) as Player);

  startTurn(): void {
    //
  }
}
