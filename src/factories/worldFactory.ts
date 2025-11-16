import { ObjKey, World, yearsPerTurnConfig } from '@/types/common'
import { Tile } from '@/types/gameObjects'
import { createObject } from '@/factories/_gameObjectFactory'
import { buildTileIndex } from '@/helpers/mapTools'
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
    for (let x = 0; y < world.sizeX; x++) {
      const tile = {
        ...createObject('tile', `[${x},${y}]`),
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
  buildTileIndex(world, tiles)
  return world
}