import { GameClass, GameObject } from '@/types/gameObjects'
import { ObjKey } from '@/types/common'
import getIcon from '@/types/icons'

export const createGameObject = (cls: GameClass, name = '', id?: string): GameObject => {
  id = id ?? crypto.randomUUID()
  const key = `${cls}:${id}` as ObjKey
  const concept = `conceptType:${cls}` as `conceptType:${string}`

  return {
    objType: 'GameObject',
    id,
    class: cls,
    key,
    concept,
    name,
    icon: getIcon(key, concept)
  } as GameObject
}