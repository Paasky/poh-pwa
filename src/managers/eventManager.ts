import { ObjKey } from '@/types/common'
import { Manager } from '@/managers/_manager'
import { EventType, GameEvent } from '@/types/events'
import { useEventStore } from '@/stores/eventStore'

export class EventManager extends Manager {
  protected _events = useEventStore()

  create (
    type: EventType,
    target: ObjKey,
    title: string,
    description?: string,
  ): GameEvent {
    const event = {
      id: crypto.randomUUID(),
      type,
      target,
      title,
      description,
      read: false
    } as GameEvent

    this._events.turnEvents.push(event)
    const setting = this._objects.getCurrentPlayer().eventSettings[type] ?? 'note'
    if (setting === 'splash') {
      this._events.splash(event)
    }
    return event
  }
}