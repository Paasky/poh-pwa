import { ObjKey } from '@/types/common'
import { UnitDesign } from '@/types/gameObjects'
import { createGameObject } from '@/factories/_gameObjectFactory'
import { TypeObject } from '@/types/typeObjects'

export const createUnitDesign = (
  equipment: TypeObject,
  platform: TypeObject,
  name?: string,
  playerKey?: ObjKey,
  isArmored: boolean = false,
): UnitDesign => {
  name = name ?? `${platform.name} ${equipment.name}`
  const base = createGameObject('unitDesign', name)

  const design = {
    ...base,

    isArmored,
    isActive: true
  } as UnitDesign

  if (playerKey) {
    design.player = playerKey
  }

  return design
}