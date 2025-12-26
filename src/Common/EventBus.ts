import type { IEvent } from "@/Common/IEvent";
import { GameKey } from "@/objects/game/_GameObject";

const listeners = new Map<GameKey, (events: IEvent[]) => void>();

export function subscribe(playerKey: GameKey, callback: (events: IEvent[]) => void) {
  listeners.set(playerKey, callback);
}

export function publishEvents(toPlayers: Set<GameKey>, events: IEvent[]) {
  toPlayers.forEach((playerKey) => listeners.get(playerKey)?.(events));
}
