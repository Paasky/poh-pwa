import { ObjKey, World, yearsPerTurnConfig } from '@/types/common'
import { useObjectsStore } from '@/stores/objectStore'
import { Tile } from '@/objects/gameObjects'

export type WorldBundle = {
  world: World,
  tiles: Tile[],
}
export const createWorld = (
  sizeX = 60,
  sizeY = 30,
): WorldBundle => {
  const objects = useObjectsStore()

  const world = {
    id: crypto.randomUUID(),
    sizeX,
    sizeY,
    turn: 0,
    year: yearsPerTurnConfig[0].start,
    currentPlayer: '' as ObjKey,
  } as World

  const tiles = [] as Tile[]
  for (let y = 0; y < world.sizeY; y++) {
    // iterate correctly over x within each row
    for (let x = 0; x < world.sizeX; x++) {
      tiles.push(new Tile(
        x,
        y,
        objects.getTypeObject('domainType:land'),
        objects.getTypeObject('continentType:taiga'),
        objects.getTypeObject('terrainType:grass'),
        objects.getTypeObject('elevationType:flat'),
      ))
    }
  }

  return { world, tiles }
}