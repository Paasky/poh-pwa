import { Player, UnitDesign } from '@/types/gameObjects'
import { createUnitDesign } from '@/factories/unitDesignFactory'
import { TypeObject } from '@/types/typeObjects'
import { Manager } from '@/managers/_manager'

export class UnitDesignManager extends Manager {
  create (
    equipment: TypeObject,
    platform: TypeObject,
    name?: string,
    player?: Player,
    isArmored: boolean = false,
  ): UnitDesign {
    const design = createUnitDesign(
      equipment,
      platform,
      name,
      player?.key,
      isArmored,
    )
    this._objects.set(design)
    if (player) {
      player.unitDesigns.push(design.key)
    }
    return design
  }
}