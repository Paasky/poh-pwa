import { ref } from "vue";
import type { Tile } from "@/objects/game/Tile";

// A lightweight singleton composable to share the currently hovered tile
const hoveredTileRef = ref<Tile | null>(null);

export function useHoveredTile() {
  return {
    hoveredTile: hoveredTileRef,
    set(tile: Tile) {
      hoveredTileRef.value = tile;
    },
    clear() {
      hoveredTileRef.value = null;
    },
  };
}

export type { Tile };
