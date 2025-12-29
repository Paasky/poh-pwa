import type { GameKey, IRawGameObject } from "@/Common/Models/_GameModel";
import type { IMutation } from "@/Common/IMutation";

export interface IEvent {
  get playerKeys(): Set<GameKey>;
  mutation?: IMutation;
  object?: IRawGameObject;
}
