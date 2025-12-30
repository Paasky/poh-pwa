/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameKey, IRawGameObject } from "@/Common/Models/_GameModel";

export interface IMutation {
  type: "create" | "update" | "remove";
  payload: IRawGameObject | any;
}

export function createMutation(type: "create" | "update" | "remove", key: GameKey): IMutation {
  return {
    type,
    payload: { key },
  };
}

export function mergeMutations(mutations: IMutation[]): IMutation[] {
  const removedKeys = new Set<GameKey>();
  const createdPayloads = new Map<GameKey, IRawGameObject | any>();
  const updatedPayloads = new Map<GameKey, IRawGameObject | any>();

  mutations.forEach((mutation) => {
    // If it's been removed, no further processing required
    if (removedKeys.has(mutation.payload)) {
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

  const out = [] as IMutation[];

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
      payload: { key },
    });
  });

  return out;
}
