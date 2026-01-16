import { IAction } from "@/Common/IAction";
import { GameKey } from "@/Common/Models/_GameModel";

const listeners = [] as ((playerKey: GameKey, actions: IAction[]) => void)[];

export function subscribeToActions(callback: (playerKey: GameKey, actions: IAction[]) => void) {
  listeners.push(callback);
}

export function pushActions(playerKey: GameKey, actions: IAction[]) {
  listeners.forEach((listener) => listener(playerKey, actions));
}
