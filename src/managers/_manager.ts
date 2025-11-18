import { useObjectsStore } from '@/stores/objectStore'

export class Manager {
  protected _objects = useObjectsStore()
}