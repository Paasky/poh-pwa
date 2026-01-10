export type GameClass =
  | "agenda"
  | "citizen"
  | "city"
  | "construction"
  | "culture"
  | "diplomacy"
  | "deal"
  | "government"
  | "incident"
  | "player"
  | "religion"
  | "research"
  | "river"
  | "tile"
  | "tradeRoute"
  | "unit"
  | "unitDesign";

export type GameKey = `${GameClass}:${string}`;

export const getKey = (cls: GameClass, id: string): GameKey => `${cls}:${id}`;
export const generateKey = (cls: GameClass) => getKey(cls, crypto.randomUUID());

export function parseKey(key: string): { cls: GameClass; id: string } {
  const parts = key.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid game obj data: key '${key}' must be format '{class}:{id}'`);
  }
  return { cls: parts[0] as GameClass, id: parts[1] };
}

export interface IRawGameObject {
  key: GameKey;
}
