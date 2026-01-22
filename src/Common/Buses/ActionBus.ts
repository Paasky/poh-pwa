import { PohAction } from "@/Common/PohAction";
import { GameKey } from "@/Common/Models/_GameModel";

const listeners = [] as ((playerKey: GameKey, actions: PohAction[]) => void)[];

export function subscribeToActions(callback: (playerKey: GameKey, actions: PohAction[]) => void) {
  listeners.push(callback);
}

export function pushActions(playerKey: GameKey, actions: PohAction[]) {
  listeners.forEach((listener) => listener(playerKey, actions));
}
