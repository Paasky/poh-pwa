import { ref } from "vue";
import { Tile } from "@/objects/game/Tile";
import { GameObject } from "@/objects/game/_GameObject";

const actionMode = ref<"move" | undefined>(undefined);
const hover = ref<Tile | undefined>(undefined);
const object = ref<GameObject | undefined>(undefined);
const tile = ref<Tile | undefined>(undefined);

// Context of what is the current Player doing right now
export function useCurrentContext() {
  return { actionMode, hover, object, tile };
}
