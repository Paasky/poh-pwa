import { ref, Ref } from "vue";
import { Unit } from "@/objects/game/Unit";
import { GameKey } from "@/objects/game/_GameObject";
import { PathStep } from "@/services/PathfinderService";

/** Move Mode Composable API */
export type UseMoveMode = {
  /** The unit currently selected for movement. */
  activeUnit: Ref<Unit | undefined>;

  /** Tiles reachable in the current turn. */
  reachableTiles: Ref<Set<GameKey>>;

  /** The path being followed if the hovered tile is clicked (Potential Path). */
  potentialPath: Ref<PathStep[]>;

  /** Any path already assigned to the unit (Current Path). */
  currentPath: Ref<PathStep[]>;

  /** Explicitly deactivate move mode and clear all state. */
  deactivate(): void;
};

const activeUnit = ref<Unit | undefined>(undefined);
const reachableTiles = ref<Set<GameKey>>(new Set());
const potentialPath = ref<PathStep[]>([]);
const currentPath = ref<PathStep[]>([]);

export function useMoveMode(): UseMoveMode {
  const deactivate = () => {
    activeUnit.value = undefined;
    reachableTiles.value = new Set();
    potentialPath.value = [];
    currentPath.value = [];
  };

  return {
    activeUnit,
    reachableTiles,
    potentialPath,
    currentPath,
    deactivate,
  };
}
