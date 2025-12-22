import { ref } from "vue";
import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { City } from "@/objects/game/City";

const actionMode = ref<"move" | undefined>(undefined);
const hover = ref<Tile | undefined>(undefined);
const object = ref<City | Unit | undefined>(undefined);
const tile = ref<Tile | undefined>(undefined);

// Context of what is the current Player doing right now
export function useCurrentContext() {
  return { actionMode, hover, object, tile };
}
