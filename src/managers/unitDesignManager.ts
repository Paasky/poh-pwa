import { useObjectsStore } from '@/stores/objectStore'
import { UnitDesign } from '@/types/gameObjects'
import { createUnitDesign } from '@/factories/unitDesignFactory'
import { TypeObject } from '@/types/typeObjects'
import { ObjKey } from '@/types/common'

export class UnitDesignManager {
  _objects = useObjectsStore()

  create (
    equipment: TypeObject,
    platform: TypeObject,
    name?: string,
    playerKey?: ObjKey,
    isArmored: boolean = false,
  ): UnitDesign {
    const design = createUnitDesign(
      equipment,
      platform,
      name,
      playerKey,
      isArmored,
    )
    this._objects.set(design)
    return design
  }
}