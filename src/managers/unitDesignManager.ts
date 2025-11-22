import { Player, UnitDesign } from '@/types/gameObjects'
import { createUnitDesign } from '@/factories/unitDesignFactory'
import { TypeObject } from '@/types/typeObjects'
import { Manager } from '@/managers/_manager'

export class UnitDesignManager extends Manager {
  create (
    platform: TypeObject,
    equipment: TypeObject,
    name?: string,
    player?: Player,
    isElite: boolean = false,
    isFree: boolean = false,
  ): UnitDesign {
    if (player && !isFree) {
      if (!player.yieldStorage.has('yieldType:designPoints', 2)) {
        throw new Error('Not enough design points to create a unit design')
      }
    }
    const design = createUnitDesign(
      equipment,
      platform,
      name,
      player?.key,
      isElite,
    )
    this._objects.set(design)
    if (player) {
      player.unitDesigns.push(design.key)
      if (!isFree) {
        player.yieldStorage.take('yieldType:designPoints', 2)
      }
    }
    return design
  }
}