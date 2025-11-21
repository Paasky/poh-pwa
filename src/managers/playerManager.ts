import { Player } from '@/types/gameObjects'
import { createPlayer, PlayerBundle } from '@/factories/playerFactory'
import { Manager } from '@/managers/_manager'
import { TypeObject } from '@/types/typeObjects'

export class PlayerManager extends Manager {
  /*
   * Set all types the player has already researched
   */
  calcKnownTypes (player: Player): void {
    const knownTypes = []

    for (const type of this._objects.getAllTypes()) {
      if (![
        'equipmentType',
        'improvementType',
        'nationalWonderType',
        'platformType',
        'policyType',
        'resourceType',
        'routeType',
        'stockpileType',
        'technologyType',
        'worldWonderType',
      ].includes(type.class)
      ) continue

      // No requirements -> always known
      if (type.requires.length === 0) {
        knownTypes.push(type)
        continue
      }

      // Check if all required technologies are researched
      let hasAll = true
      for (const requireKey of type.requires) {
        if (Array.isArray(requireKey)) {
          // If the player has researched any of the techs
          let hasAny = false
          for (const reqAnyKey of requireKey) {
            // Ignore non-tech
            if (!reqAnyKey.startsWith('technologyType:')) continue

            const require = this._objects.getTypeObject(reqAnyKey)
            if (player.research.researched.includes(require)) {
              hasAny = true
              break
            }
          }
          if (!hasAny) {
            hasAll = false
            break
          }
        } else {
          // Ignore non-tech
          if (!requireKey.startsWith('technologyType:')) continue

          // If the player has researched this tech
          const require = this._objects.getTypeObject(requireKey)
          if (!player.research.researched.includes(require)) {
            hasAll = false
            break
          }
        }
      }

      // All requirements met -> add to known types
      if (hasAll) {
        knownTypes.push(type)
      }
    }

    player.knownTypes = knownTypes
  }

  calcTiles (player: Player): void {
  }

  calcYields (player: Player): void {
  }

  create (
    name: string,
    cultureType: TypeObject,
    isCurrent = false,
  ): Player {
    const playerBundle = createPlayer(name, cultureType, isCurrent) as PlayerBundle
    this._objects.bulkSet([playerBundle.player, playerBundle.culture])

    new PlayerManager().calcKnownTypes(playerBundle.player)

    return playerBundle.player
  }

  endTurn (player: Player): void {
  }

  startTurn (player: Player): void {
  }
}