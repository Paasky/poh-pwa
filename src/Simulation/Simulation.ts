import { subscribe } from "@/Common/ActionBus";
import { IAction } from "@/Common/IAction";
import { GameKey } from "@/objects/game/_GameObject";

export class Simulation {
  constructor() {
    subscribe(this.onAction.bind(this));
  }

  onAction(playerKey: GameKey, action: IAction) {
    // todo
  }
}
