import { ref } from "vue";
import { Tile } from "@/Common/Models/Tile";
import { GameObject } from "@/Common/Models/_GameModel";

const actionMode = ref<"move" | undefined>(undefined);
const hover = ref<Tile | undefined>(undefined);
const object = ref<GameObject | undefined>(undefined);
const tile = ref<Tile | undefined>(undefined);

// Context of what is the current Player doing right now
export function useCurrentContext() {
  return { actionMode, hover, object, tile };
}
