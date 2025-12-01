import { Manager } from '@/managers/_manager'
import { EventType, GameEvent } from '@/types/events'
import { useEventStore } from '@/stores/eventStore'
import { GameObject, Player } from '@/objects/game/gameObjects'

export class EventManager extends Manager {
  protected _events = useEventStore()

  create (
    type: EventType,
    title: string,
    player?: Player,
    target?: GameObject,
    description?: string,
  ): GameEvent {
    const event = {
      id: crypto.randomUUID(),
      type,
      player,
      target,
      title,
      description,
      read: false
    } as GameEvent

    this._events.turnEvents.push(event as any)
    const setting = this._events.eventSettings[type] ?? 'full'
    if (setting === 'full') {
      this._events.open(event)
    }
    return event
  }
}