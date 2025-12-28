import { IAction } from "@/Common/IAction";
import { GameKey } from "@/objects/game/_GameObject";

const listeners = [] as ((playerKey: GameKey, action: IAction) => void)[];

export function subscribe(callback: (playerKey: GameKey, action: IAction) => void) {
  listeners.push(callback);
}

export function pushAction(playerKey: GameKey, action: IAction) {
  listeners.forEach((listener) => listener(playerKey, action));
}
