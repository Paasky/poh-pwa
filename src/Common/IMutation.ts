/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IRawGameObject } from "@/objects/game/_GameObject";

export interface IMutation {
  type: "create" | "update" | "remove";
  payload: IRawGameObject | any;
}
