import type { PohEvent } from "@/Common/PohEvent";
import { GameKey } from "@/Common/Models/_GameModel";

const listeners = new Map<GameKey, (events: PohEvent[]) => void>();

export function subscribeToEvents(playerKey: GameKey, callback: (events: PohEvent[]) => void) {
  listeners.set(playerKey, callback);
}

export function publishEvents(events: PohEvent[]) {
  // Group by PlayerKey so we only publish once to each player
  const eventsPerPlayerKey = new Map<GameKey, PohEvent[]>();
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
