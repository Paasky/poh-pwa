/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorldState } from "@/types/common";

export interface StaticData {
  categories: any[];
  types: any[];
}

export interface GameData {
  objects: any[];
  world: WorldState;
}
