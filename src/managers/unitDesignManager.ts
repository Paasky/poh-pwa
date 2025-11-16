import { useObjectsStore } from '@/stores/objectStore'
import { UnitDesign } from '@/types/gameObjects'

export class UnitDesignManager {
  _objects = useObjectsStore()

  create (): UnitDesign {
  }
}