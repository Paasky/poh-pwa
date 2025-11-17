import { ObjKey } from '@/types/common'
import { Unit } from '@/types/gameObjects'
import { createGameObject } from '@/factories/_gameObjectFactory'

export const createUnit = (
  playerKey: ObjKey,
  unitDesignKey: ObjKey,
  tileKey: ObjKey,
  moves: number,
  isLevy: boolean,
  isMercenary: boolean,
  isMobilized: boolean,
  health: number = 100,
  cityKey?: ObjKey,
  tradeRouteKey?: ObjKey,
): Unit => {
  const base = createGameObject('unit')

  const unit = {
    ...base,

    player: playerKey,
    design: unitDesignKey,
    tile: tileKey,
    health,
    moves,
    isLevy,
    isMercenary,
    isMobilized,
  } as Unit

  if (cityKey) {
    unit.city = cityKey
  }
  if (tradeRouteKey) {
    unit.tradeRoute = tradeRouteKey
  }

  return unit
}