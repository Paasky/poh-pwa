import type { GameKey } from "@/objects/game/_GameObject";

/**
 * MoveContext provides external state and policy for MovementService calculations.
 */
export type MoveContext = {
  // Visibility/knowledge policy

  /** Tile keys known by the player; used to block multi-turn paths into the unknown (fog). */
  known: ReadonlySet<GameKey>;

  /** Tile keys currently visible; used to resolve what units the player can 'see' in the path. */
  visible: ReadonlySet<GameKey>;

  /** Policy flag: if false, unit cannot enter any unknown tile even on the first turn. */
  canEnterUnknownThisTurn: boolean;

  // Board state

  /** Tiles (the unit's player knows) with friendly units; prevents ending turn there but allows passing through if moves remain. */
  friendlyUnitTiles: ReadonlySet<GameKey>;

  /** Tiles (the unit's player knows) with enemy units; acts as an impassable barrier. */
  enemyUnitTiles: ReadonlySet<GameKey>;

  // Unit state overrides

  /** Initial unit state override (e.g., if pathing starts from a hypothetical embarked state). */
  isEmbarked: boolean;

  /** Policy flag: if true, unit can move through enemy Zone of Control without stopping. */
  ignoreZoc: boolean;
};
