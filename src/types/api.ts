/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorldState } from "@/Common/Objects/Common";
import { IRawGameObject } from "@/Common/Models/_GameTypes";

export interface StaticData {
  categories: any[];
  types: any[];
}

export interface GameData {
  objects: IRawGameObject[];
  world: WorldState;
}
