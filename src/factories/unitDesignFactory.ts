import { GameKey } from '@/types/common'
import { UnitDesign } from '@/types/gameObjects'
import { createGameObject } from '@/factories/_gameObjectFactory'
import { TypeObject } from '@/types/typeObjects'

export const createUnitDesign = (
  equipment: TypeObject,
  platform: TypeObject,
  name?: string,
  playerKey?: GameKey,
  isElite: boolean = false,
): UnitDesign => {

  name = name ?? equipment.names![platform.key] ?? `${platform.name} ${equipment.name}`
  const base = createGameObject('unitDesign', name)

  const design = {
    ...base,

    equipment,
    platform,
    isElite,
    isActive: true
  } as UnitDesign

  if (playerKey) {
    design.player = playerKey
  }

  return design
}