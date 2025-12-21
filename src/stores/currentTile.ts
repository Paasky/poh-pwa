import { ref } from "vue";
import type { Tile } from "@/objects/game/Tile";

const hoveredTile = ref<Tile>();
const selectedTile = ref<Tile>();
const contextTile = ref<Tile>();

/**
 * Central repository for the "active" tiles in the current session.
 *
 * Adheres to KISS by using simple assignment as the unified pattern.
 * Interaction rules (like clearing context on left-click) are handled
 * at the attachment layer (LogicMeshBuilder).
 */
export function useCurrentTile() {
  return {
    hoveredTile,
    selectedTile,
    contextTile,
  };
}

export type { Tile };
