/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorldState } from "@/Common/Objects/Common";

export interface StaticData {
  categories: any[];
  types: any[];
}

export interface GameData {
  objects: any[];
  world: WorldState;
}
