 
import z from "zod";
import { GameKey, GameObject } from "@/Common/Models/_GameModel";
import { gameKeySchema } from "@/Common/Validation";

export class PohMutation<PayloadT extends GameObject> {
  type: MutationType;
  payload: { key: GameKey } & Partial<PayloadT>;

  constructor(type: MutationType, payload: { key: GameKey } & Partial<PayloadT>) {
    this.type = type;
    this.payload = payload;
  }

  static fromData<PayloadT extends GameObject>(data: PohMutationData): PohMutation<PayloadT> {
    return new PohMutation<PayloadT>(data.type, data.payload as PayloadT);
  }

  toData(): PohMutationData {
    return {
      type: this.type,
      payload: this.payload,
    };
  }
}

export type MutationType = "create" | "update" | "remove" | "append" | "filter" | "setKeys";

export const PohMutationSchema = z.object({
  type: z.enum(["create", "update", "remove", "append", "filter", "setKeys"]),
  payload: z.object({ key: gameKeySchema() }),
});

export type PohMutationData = z.infer<typeof PohMutationSchema>;
