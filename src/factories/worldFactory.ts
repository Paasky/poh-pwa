import { ObjKey, World, yearsPerTurnConfig } from '@/types/common'
import { Tile } from '@/types/gameObjects'
import { createGameObject } from '@/factories/_gameObjectFactory'
import { useObjectsStore } from '@/stores/objectStore'

export const createWorld = (
  sizeX = 60,
  sizeY = 30,
): World => {
  const objects = useObjectsStore()

  const world = {
    id: crypto.randomUUID(),
    sizeX,
    sizeY,
    turn: 0,
    year: yearsPerTurnConfig[0].start,
    currentPlayer: '' as ObjKey,
    tiles: {},
  } as World

  const tiles = [] as Tile[]
  for (let y = 0; y < world.sizeY; y++) {
    // iterate correctly over x within each row
    for (let x = 0; x < world.sizeX; x++) {
      const tile = {
        ...createGameObject('tile', `[${x},${y}]`),
        x,
        y,
        domain: objects.getTypeObject('domainType:land'),
        area: objects.getTypeObject('continentType:taiga'),
        terrain: objects.getTypeObject('terrainType:grass'),
        elevation: objects.getTypeObject('elevationType:flat'),
        citizens: [],
        tradeRoutes: [],
        units: [],
      }
      tiles.push(tile)
    }
  }

  for (const tile of tiles) {
    world.tiles[`[${tile.x},${tile.y}]` as `${number},${number}`] = tile
  }

  return world
}