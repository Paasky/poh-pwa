import { createUnitDesign } from '@/factories/unitDesignFactory'
import { Manager } from '@/managers/_manager'
import { Player, UnitDesign } from '@/objects/gameObjects'
import { UnitDesignPrototype } from '@/objects/player'
import { TypeObject } from '@/types/typeObjects'

export class UnitDesignManager extends Manager {
  create (
    prototype: UnitDesignPrototype,
    isFree: boolean = false,
  ): UnitDesign {
    const player = prototype.player ? prototype.player as Player : undefined
    if (player && !isFree) {
      if (!player.storage.has('yieldType:designPoints', prototype.pointCost.value)) {
        throw new Error('Not enough design points to create a unit design')
      }
    }
    const design = createUnitDesign(
      prototype.equipment.value as TypeObject,
      prototype.platform.value as TypeObject,
      prototype.name.value,
      player,
      prototype.isElite.value,
    )
    this._objects.set(design)
    if (player) {
      player.designKeys.value.push(design.key)
      if (!isFree) {
        player.storage.take('yieldType:designPoints', prototype.pointCost.value)
      }
    }
    return design
  }
}