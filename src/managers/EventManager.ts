import { EventType, GameEvent } from "@/types/events";
import { useEventStore } from "@/stores/eventStore";
import { GameObject } from "@/objects/game/_GameObject";
import { Player } from "@/objects/game/Player";

export class EventManager {
  protected _events = useEventStore();

  create(
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
      read: false,
    } as GameEvent;

    // IDE mixes up ref contents
    // eslint-disable-next-line
    this._events.turnEvents.push(event as any);
    const setting = this._events.eventSettings[type] ?? "full";
    if (setting === "full") {
      this._events.open(event);
    }
    return event;
  }
}
