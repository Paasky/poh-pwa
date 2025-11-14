import { Culture, CultureStatus } from '@/types/gameObjects'
import { ObjKey } from '@/types/common'
import { TypeObject } from '@/types/typeObjects'
import { createObject } from '@/factories/_gameObjectFactory'

export const createCulture = (
  playerKey: ObjKey,
  name = '',
  status: CultureStatus = 'notSettled',
  heritages: TypeObject[] = [],
  heritageCategoryPoints: Record<ObjKey, number> = {},
  traits: TypeObject[] = [],
): Culture => {
  const base = createObject('culture', name)

  return {
    ...base,
    player: playerKey,
    status,

    heritages,
    heritageCategoryPoints,
    selectableHeritages: [],

    traits,
    selectableTraits: [],
    mustSelectTraits: { positive: 0, negative: 0 }
  }
}