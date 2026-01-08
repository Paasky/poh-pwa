/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameKey, IRawGameObject } from "@/Common/Models/_GameModel";

export interface IMutation<PayloadT> {
  type: MutationType;
  action?: MutationAction;
  payload: Partial<PayloadT> & { key: GameKey };
}

export type MutationType = "create" | "update" | "remove" | "append" | "filter" | "setKeys" | "action";
export type MutationAction = "actionCrisis";

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
