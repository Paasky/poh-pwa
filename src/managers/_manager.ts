import { useObjectsStore } from '@/stores/objectStore'
import { useEventStore } from '@/stores/eventStore'

export class Manager {
  protected _events = useEventStore()
  protected _objects = useObjectsStore()
}