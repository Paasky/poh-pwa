import { UnitDesign } from "../../src/Common/Models/UnitDesign";
import { initTypeObject } from "../../src/Common/Objects/TypeObject";
import { GameKey } from "../../src/Common/Models/_GameModel";
import { Tile } from "../../src/Common/Models/Tile";
import { PathStep } from "../../src/movement/Pathfinder";
import { MoveContext } from "../../src/movement/MoveContext";

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
 * Factory for creating a MoveContext object with default values.
 */
export const createMovementContext = (overrides: Partial<MoveContext> = {}): MoveContext => ({
  known: new Set(),
  visible: new Set(),
  canEnterUnknownThisTurn: true,
  friendlyUnitTiles: new Set(),
  enemyUnitTiles: new Set(),
  isEmbarked: false,
  ignoreZoc: false,
  ...overrides,
});
