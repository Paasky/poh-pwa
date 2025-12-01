import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import getIcon from "@/types/icons";
import { CategoryClass, CategoryObject, TypeClass, TypeObject } from "@/types/typeObjects";
import { GameClass, GameKey, GameObject } from "@/objects/game/_GameObject";

export type ObjType = "TypeObject" | "CategoryObject" | "GameObject";
export type CatKey = `${CategoryClass}:${string}`;
export type TypeKey = `${TypeClass}:${string}`;
export type ObjKey = CatKey | TypeKey | GameKey;

export interface PohObject {
  objType: ObjType;
  class: CategoryClass | TypeClass | GameClass;
  id: string;
  key: ObjKey;
  name: string;
  concept: `conceptType:${string}`;
  icon: ObjectIcon;
}

export function classAndId(key: string): {
  class: CategoryClass | TypeClass | GameClass;
  id: string;
} {
  const [c, i] = key.split(":");
  return { class: c as CategoryClass | TypeClass | GameClass, id: i };
}

// eslint-disable-next-line
export function initPohObject(objType: ObjType, data: any): PohObject {
  return {
    ...data,
    objType,
    ...classAndId(data.key),
    key: data.key,
    name: data.name ?? "",
    concept: data.concept,
    icon: getIcon(data.key, data.concept, data.category),
  };
}

export function isCategoryObject(o: GameObject | PohObject): o is CategoryObject {
  return o.objType === "CategoryObject";
}

export function isTypeObject(o: GameObject | PohObject): o is TypeObject {
  return o.objType === "TypeObject";
}

export function isGameObject(o: GameObject | PohObject): o is GameObject {
  return o.objType === "GameObject";
}

export type World = {
  id: string;
  sizeX: number;
  sizeY: number;
  turn: number;
  year: number;
  currentPlayer: GameKey;
};

export type ObjectIcon = {
  icon: IconDefinition;
  color: string;
};

export const yearsPerTurnConfig = [
  { start: -10000, end: -7000, yearsPerTurn: 60 },
  { start: -7000, end: -4000, yearsPerTurn: 60 },
  { start: -4000, end: -2500, yearsPerTurn: 30 },
  { start: -2500, end: -1000, yearsPerTurn: 30 },
  { start: -1000, end: -250, yearsPerTurn: 15 },
  { start: -250, end: 500, yearsPerTurn: 15 },
  { start: 500, end: 1000, yearsPerTurn: 10 },
  { start: 1000, end: 1400, yearsPerTurn: 8 },
  { start: 1400, end: 1600, yearsPerTurn: 4 },
  { start: 1600, end: 1700, yearsPerTurn: 2 },
  { start: 1700, end: 1775, yearsPerTurn: 1.5 },
  { start: 1775, end: 1850, yearsPerTurn: 1.5 },
  { start: 1850, end: 1900, yearsPerTurn: 1 },
  { start: 1900, end: 1950, yearsPerTurn: 1 },
  { start: 1950, end: 1975, yearsPerTurn: 0.5 },
  { start: 1975, end: 2000, yearsPerTurn: 0.5 },
  { start: 2000, end: 2015, yearsPerTurn: 0.333 },
  { start: 2015, end: 2030, yearsPerTurn: 0.333 },
  { start: 2030, end: 99999999, yearsPerTurn: 0.333 },
];

export function roundToTenth(v: number): number {
  return Math.round(v * 10) / 10;
}
