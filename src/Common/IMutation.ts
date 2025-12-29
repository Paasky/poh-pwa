/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IRawGameObject } from "@/Common/Models/_GameModel";

export interface IMutation {
  type: "create" | "update" | "remove";
  payload: IRawGameObject | any;
}
