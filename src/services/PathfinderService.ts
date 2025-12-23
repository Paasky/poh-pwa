import TinyQueue from "tinyqueue";
import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { GameKey } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { MovementContext } from "@/services/MovementContext";

/** Data structure representing a single step in a calculated path */
export type PathStep = {
  /** The tile at this step */
  tile: Tile;
  /** The turn number this step is reached on (0 = current turn) */
  turn: number;
  /** Flag indicating a turn ends on this tile; used to render Turn Markers */
  isTurnEnd: boolean;
  /** Movement points remaining after reaching this tile */
  movesRemaining: number;
};

type Node = {
  tile: Tile;
  cumulativeCost: number;
  heuristicCost: number;
  totalEstimatedCost: number;
  turn: number;
  movesRemaining: number;
  parent: Node | null;
};

/** Pathfinder API */
export class PathfinderService {
  /** Constructor is stateless for MVP */
  constructor() {}

  /**
   * Calculates the optimal path from start to target.
   */
  findPath(unit: Unit, target: Tile, context: MovementContext): PathStep[] {
    const mapSize = useObjectsStore().world.size;

    const startTile = unit.tile.value;
    if (startTile.key === target.key) return [];

    const openSet = new TinyQueue<Node>([], (a, b) => a.totalEstimatedCost - b.totalEstimatedCost);
    // Use tile key to avoid re-visiting the same tile with a higher cost
    const closedSet = new Map<GameKey, number>();

    const startNode: Node = {
      tile: startTile,
      cumulativeCost: 0,
      heuristicCost: this.heuristic(startTile, target, mapSize),
      totalEstimatedCost: this.heuristic(startTile, target, mapSize),
      turn: 0,
      movesRemaining: unit.movement.moves.value,
      parent: null,
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
      const current = openSet.pop()!;

      if (current.tile.key === target.key) {
        return this.reconstructPath(current);
      }

      const stateKey = current.tile.key;
      if (closedSet.has(stateKey) && closedSet.get(stateKey)! <= current.cumulativeCost) {
        continue;
      }
      closedSet.set(stateKey, current.cumulativeCost);

      for (const neighbor of current.tile.neighborTiles()) {
        const nextState = unit.movement.calculateNextState(
          current.turn,
          current.movesRemaining,
          neighbor,
          current.tile,
          context,
        );
        if (nextState === null) continue;

        // Friendly Unit Constraint: cannot end path on a friendly unit
        if (context.friendlyUnitTiles.has(neighbor.key) && neighbor.key === target.key) {
          continue;
        }

        const cumulativeCost = current.cumulativeCost + nextState.cost;
        const heuristicCost = this.heuristic(neighbor, target, mapSize);
        const nextNode: Node = {
          tile: neighbor,
          cumulativeCost,
          heuristicCost,
          totalEstimatedCost: cumulativeCost + heuristicCost,
          turn: nextState.turn,
          movesRemaining: nextState.movesRemaining,
          parent: current,
        };

        openSet.push(nextNode);
      }
    }

    return [];
  }

  /**
   * Returns all tiles reachable within the current turn's remaining moves.
   */
  getReachableTiles(unit: Unit, context: MovementContext): Set<GameKey> {
    const reachable = new Set<GameKey>();
    const startTile = unit.tile.value;
    if (!startTile) return reachable;

    const queue: { tile: Tile; movesRemaining: number }[] = [
      { tile: startTile, movesRemaining: unit.movement.moves.value },
    ];
    const visited = new Map<GameKey, number>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.tile.key !== startTile.key) {
        reachable.add(current.tile.key);
      }

      for (const neighbor of current.tile.neighborTiles()) {
        const nextState = unit.movement.calculateNextState(
          0,
          current.movesRemaining,
          neighbor,
          current.tile,
          context,
        );

        if (nextState === null || nextState.turn > 0) continue;

        const previouslyVisitedMoves = visited.get(neighbor.key);

        if (
          previouslyVisitedMoves === undefined ||
          previouslyVisitedMoves < nextState.movesRemaining
        ) {
          visited.set(neighbor.key, nextState.movesRemaining);
          queue.push({ tile: neighbor, movesRemaining: nextState.movesRemaining });
        }
      }
    }

    return reachable;
  }

  private heuristic(tileA: Tile, tileB: Tile, mapSize: { x: number; y: number }): number {
    let deltaX = tileA.x - tileB.x;
    const deltaY = tileA.y - tileB.y;

    // Wrap X
    const halfX = mapSize.x / 2;
    if (Math.abs(deltaX) > halfX) {
      deltaX = deltaX > 0 ? deltaX - mapSize.x : deltaX + mapSize.x;
    }

    // Hex distance formula for row-offset layouts
    return (Math.abs(deltaX) + Math.abs(deltaY) + Math.abs(deltaX + deltaY)) / 2;
  }

  private reconstructPath(node: Node): PathStep[] {
    const path: PathStep[] = [];
    let current: Node | null = node;
    let childTurn = node.turn;

    while (current && current.parent) {
      path.push({
        tile: current.tile,
        turn: current.turn,
        isTurnEnd: current === node || current.turn !== childTurn,
        movesRemaining: current.movesRemaining,
      });
      childTurn = current.turn;
      current = current.parent;
    }

    return path.reverse();
  }
}
