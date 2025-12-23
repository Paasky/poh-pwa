import { UnitDesign } from "../../src/objects/game/UnitDesign";
import { initTypeObject } from "../../src/types/typeObjects";
import { GameKey } from "../../src/objects/game/_GameObject";
import { Tile } from "../../src/objects/game/Tile";
import { PathStep } from "../../src/services/PathfinderService";
import { MovementContext } from "../../src/services/MovementContext";

/**
 * Factory for creating a real UnitDesign instance without mocking.
 * Useful for tests that depend on design properties or cache keys.
 */
export const createTestDesign = (
  platform = "land",
  equipment = "infantry",
  key = "unitDesign:test" as GameKey,
) => {
  return new UnitDesign(
    key,
    initTypeObject({ key: `platformType:${platform}` }),
    initTypeObject({ key: `equipmentType:${equipment}` }),
    "Test Unit",
  );
};

/**
 * Factory for creating a PathStep object without partials.
 */
export const createPathStep = (
  tile: Tile,
  movesRemaining = 0,
  turn = 0,
  isTurnEnd = false,
): PathStep => ({
  tile,
  movesRemaining,
  turn,
  isTurnEnd,
});

/**
 * Factory for creating a MovementContext object with default values.
 */
export const createMovementContext = (
  overrides: Partial<MovementContext> = {},
): MovementContext => ({
  known: new Set(),
  visible: new Set(),
  canEnterUnknownThisTurn: true,
  friendlyUnitTiles: new Set(),
  enemyUnitTiles: new Set(),
  isEmbarked: false,
  ...overrides,
});
