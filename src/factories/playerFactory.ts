import { TypeObject } from '@/types/typeObjects'
import { createCulture } from '@/factories/cultureFactory'
import { Culture, generateKey, Player } from '@/objects/gameObjects'

export type PlayerBundle = {
  player: Player
  culture: Culture
}

export const createPlayer = (
  name: string,
  cultureType: TypeObject,
  isCurrent = false,
): PlayerBundle => {
  const player = new Player(generateKey('player'), name, isCurrent)
  const culture = createCulture(player.key, cultureType)
  player.cultureKey.value = culture.key

  return {
    player,
    culture,
  }
}