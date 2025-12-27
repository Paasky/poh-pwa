import type { GameKey, IRawGameObject } from "@/objects/game/_GameObject";
import type { IMutation } from "@/Common/IMutation";

export interface IEvent {
  get playerKeys(): Set<GameKey>;
  mutation?: IMutation;
  object?: IRawGameObject;
}
