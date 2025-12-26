import { GameKey } from "@/objects/game/_GameObject";

export interface IEvent {
  get playerKeys(): Set<GameKey>;
}
