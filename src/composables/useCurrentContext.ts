import { ref, shallowRef } from "vue";
import { Tile } from "@/Common/Models/Tile";
import { GameObject } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";

const actionMode = ref<"move" | undefined>(undefined);
// Set on appStore.init()
const currentPlayer = shallowRef<Player | null>(null);
const hover = ref<Tile | undefined>(undefined);
const object = ref<GameObject | undefined>(undefined);
const tile = ref<Tile | undefined>(undefined);

// Context of what is the current Player doing right now
export function useCurrentContext() {
  return {
    actionMode,
    get currentPlayer() {
      if (!currentPlayer.value) throw new Error("Current Player is not set in currentContext");
      return currentPlayer.value;
    },
    hover,
    object,
    tile,
  };
}

export function setCurrentPlayer(player: Player) {
  currentPlayer.value = player;
}
