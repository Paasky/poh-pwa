import type { IEvent } from "@/Common/IEvent";
import { GameKey } from "@/objects/game/_GameObject";

const listeners = new Map<GameKey, (events: IEvent[]) => void>();

export function subscribe(playerKey: GameKey, callback: (events: IEvent[]) => void) {
  listeners.set(playerKey, callback);
}

export function publishEvents(events: IEvent[]) {
  // Group by PlayerKey so we only publish once to each player
  const eventsPerPlayerKey = new Map<GameKey, IEvent[]>();
  events.forEach((event) => {
    event.playerKeys.forEach((playerKey) => {
      const playerEvents = eventsPerPlayerKey.get(playerKey);
      if (playerEvents) {
        playerEvents.push(event);
      } else {
        eventsPerPlayerKey.set(playerKey, [event]);
      }
    });
  });
  eventsPerPlayerKey.forEach((playerEvents, playerKey) => listeners.get(playerKey)?.(playerEvents));
}
