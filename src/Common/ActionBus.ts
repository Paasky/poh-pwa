import { Action } from "@/Common/IAction";
import { GameKey } from "@/Common/Models/_GameModel";

const listeners = [] as ((playerKey: GameKey, actions: Action[]) => void)[];

export function subscribe(callback: (playerKey: GameKey, actions: Action[]) => void) {
  listeners.push(callback);
}

export function pushActions(playerKey: GameKey, actions: Action[]) {
  listeners.forEach((listener) => listener(playerKey, actions));
}
