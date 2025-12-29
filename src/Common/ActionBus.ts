import { Action } from "@/Common/IAction";
import { GameKey } from "@/Common/Models/_GameModel";

const listeners = [] as ((playerKey: GameKey, action: Action) => void)[];

export function subscribe(callback: (playerKey: GameKey, action: Action) => void) {
  listeners.push(callback);
}

export function pushAction(playerKey: GameKey, action: Action) {
  listeners.forEach((listener) => listener(playerKey, action));
}
