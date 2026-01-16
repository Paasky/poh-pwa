import { GameKey, GameObject, IRawGameObject } from "@/Common/Models/_GameModel";
import { IMutation } from "@/Common/IMutation";

export interface IEvent {
  get playerKeys(): Set<GameKey>;

  mutation?: IMutation<Partial<GameObject>>;
  object?: IRawGameObject;
}
