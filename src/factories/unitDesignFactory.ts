import { TypeObject } from '@/types/typeObjects'
import { generateKey, Player, UnitDesign } from '@/objects/game/gameObjects'

export const createUnitDesign = (
  equipment: TypeObject,
  platform: TypeObject,
  name: string,
  player?: Player,
  isElite: boolean = false,
): UnitDesign => {
  const design = new UnitDesign(
    generateKey('unitDesign'),
    equipment,
    platform,
    isElite
      ? (name.endsWith(' (E)') ? name : name + ' (E)')
      : (name.endsWith(' (E)') ? name.slice(0, -3) : name),
    player?.key,
    isElite
  )

  if (player) {
    player.designKeys.value.push(design.key)
  }

  return design
}