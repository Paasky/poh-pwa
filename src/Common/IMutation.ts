/* eslint-disable @typescript-eslint/no-explicit-any */
import z from "zod";
import { GameKey, GameObject, IRawGameObject } from "@/Common/Models/_GameModel";
import { gameKeySchema } from "@/Common/Validation";

export type MutationType = "create" | "update" | "remove" | "append" | "filter" | "setKeys";
export type MutationAction = "actionCrisis";

export const PohMutationSchema = z.object({
  type: z.enum(["create", "update", "remove", "append", "filter", "setKeys"]),
  payload: z.object({ key: gameKeySchema() }),
});

export type PohMutationData = z.infer<typeof PohMutationSchema>;

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

export interface IMutation<PayloadT> {
  type: MutationType;
  action?: MutationAction;
  payload: Partial<PayloadT> & { key: GameKey };
}

export function mergeMutations<PayloadT>(mutations: IMutation<PayloadT>[]): IMutation<PayloadT>[] {
  const removedKeys = new Set<GameKey>();
  const createdPayloads = new Map<GameKey, IRawGameObject | any>();
  const updatedPayloads = new Map<GameKey, IRawGameObject | any>();

  mutations.forEach((mutation) => {
    // If it's been removed, no further processing required
    if (removedKeys.has(mutation.payload.key)) {
      return;
    }

    if (mutation.type === "create") {
      const existing = createdPayloads.get(mutation.payload.key);
      if (existing) {
        Object.assign(existing.payload, mutation.payload);
      } else {
        createdPayloads.set(mutation.payload.key, mutation.payload);
      }
      return;
    }

    if (mutation.type === "update") {
      const existing = updatedPayloads.get(mutation.payload.key);
      if (existing) {
        Object.assign(existing.payload, mutation.payload);
      } else {
        updatedPayloads.set(mutation.payload.key, mutation.payload);
      }
      return;
    }

    // If it's been removed, ignore all create/updates
    if (mutation.type === "remove") {
      createdPayloads.delete(mutation.payload.key);
      updatedPayloads.delete(mutation.payload.key);
      removedKeys.add(mutation.payload.key);
      return;
    }
  });

  const out = [] as IMutation<PayloadT>[];

  createdPayloads.forEach((payload) => {
    out.push({
      type: "create",
      payload,
    });
  });
  updatedPayloads.forEach((payload) => {
    out.push({
      type: "update",
      payload,
    });
  });
  removedKeys.forEach((key) => {
    out.push({
      type: "remove",
      payload: { key } as any,
    });
  });

  return out;
}
