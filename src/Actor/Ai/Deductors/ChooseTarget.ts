import { Priority } from "@/Actor/Ai/AiTypes";
import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { Tile } from "@/Common/Models/Tile";
import { Unit } from "@/Common/Models/Unit";
import { getDistance } from "@/Common/Helpers/mapTools";
import { useDataBucket } from "@/Data/useDataBucket";

export function chooseAttackTarget(
  object: City | Unit,
  priority?: Priority,
): City | Construction | Tile | Unit {
  // todo
  return object instanceof Unit ? object.tile : object;
}

export function chooseBombardTarget(
  object: City | Unit,
  priority?: Priority,
): City | Construction | Tile | Unit {
  // todo
  return object instanceof Unit ? object.tile : object;
}

export function chooseMoveTo(unit: Unit, priority?: Priority): Tile {
  const currentTile = unit.tile;

  if (!priority?.areaId) {
    return chooseBestNeighbor(currentTile);
  }

  const targetTiles = priority.areaId ? getTargetTilesForArea(priority.areaId) : new Set<Tile>();

  if (targetTiles.size === 0) {
    return chooseBestNeighbor(currentTile);
  }

  const closestTarget = findClosestTile(currentTile, Array.from(targetTiles));

  if (!closestTarget) {
    return chooseBestNeighbor(currentTile);
  }

  const nextTile = chooseNextTileToward(currentTile, closestTarget);
  return nextTile || currentTile;
}

function getTargetTilesForArea(areaId: string): Set<Tile> {
  return new Set<Tile>();
}

function findClosestTile(from: Tile, targets: Tile[]): Tile | null {
  if (targets.length === 0) return null;

  const worldSize = useDataBucket().world.size;
  let closest = targets[0];
  let minDistance = getDistance(
    worldSize,
    { x: from.x, y: from.y },
    { x: closest.x, y: closest.y },
    "hex",
  );

  for (const target of targets) {
    const distance = getDistance(
      worldSize,
      { x: from.x, y: from.y },
      { x: target.x, y: target.y },
      "hex",
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = target;
    }
  }

  return closest;
}

function chooseNextTileToward(from: Tile, to: Tile): Tile | null {
  const neighbors = from.neighborTiles;
  if (neighbors.length === 0) return null;

  const worldSize = useDataBucket().world.size;
  let bestNeighbor = neighbors[0];
  let minDistance = getDistance(
    worldSize,
    { x: bestNeighbor.x, y: bestNeighbor.y },
    { x: to.x, y: to.y },
    "hex",
  );

  for (const neighbor of neighbors) {
    const distance = getDistance(
      worldSize,
      { x: neighbor.x, y: neighbor.y },
      { x: to.x, y: to.y },
      "hex",
    );
    if (distance < minDistance) {
      minDistance = distance;
      bestNeighbor = neighbor;
    }
  }

  return bestNeighbor;
}

function chooseBestNeighbor(tile: Tile): Tile {
  const neighbors = tile.neighborTiles;
  if (neighbors.length === 0) return tile;

  const explorable = neighbors.filter((n) => !n.playerKey);
  if (explorable.length > 0) {
    return explorable[0];
  }

  return neighbors[0];
}
