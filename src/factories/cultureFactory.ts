import { Culture, CultureStatus, GameObject } from '@/types/gameObjects'
import { ObjKey } from '@/types/common'
import { TypeObject } from '@/types/typeObjects'
import { createGameObject } from '@/factories/_gameObjectFactory'

export const createCulture = (
  player: GameObject, // Allow passing in the base game object to avoid circular dependencies
  type: TypeObject,
  status: CultureStatus = 'notSettled',
  heritages: TypeObject[] = [],
  heritageCategoryPoints: Record<ObjKey, number> = {},
  traits: TypeObject[] = [],
): Culture => {
  const base = createGameObject('culture', `${player.name} Culture`)

  return {
    ...base,
    player: player.key,
    type,
    status,

    heritages,
    heritageCategoryPoints,
    selectableHeritages: [] as TypeObject[],

    traits,
    selectableTraits: [] as TypeObject[],
    mustSelectTraits: { positive: 0, negative: 0 }
  }
}