import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import getIcon from '@/types/icons'
import { CategoryClass, CategoryObject, TypeClass, TypeObject } from '@/types/typeObjects'
import { GameClass, GameKey, GameObject } from '@/objects/game/_GameObject'

export type ObjType = 'TypeObject' | 'CategoryObject' | 'GameObject';
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

export function classAndId (key: string): {
  class: CategoryClass | TypeClass | GameClass;
  id: string;
} {
  const [c, i] = key.split(':')
  return { class: c as CategoryClass | TypeClass | GameClass, id: i }
}

// eslint-disable-next-line
export function initPohObject (objType: ObjType, data: any): PohObject {
  return {
    ...data,
    objType,
    ...classAndId(data.key),
    key: data.key,
    name: data.name ?? '',
    concept: data.concept,
    icon: getIcon(data.key, data.concept, data.category),
  }
}

export function isCategoryObject (o: GameObject | PohObject): o is CategoryObject {
  return o.objType === 'CategoryObject'
}

export function isTypeObject (o: GameObject | PohObject): o is TypeObject {
  return o.objType === 'TypeObject'
}

export function isGameObject (o: GameObject | PohObject): o is GameObject {
  return o.objType === 'GameObject'
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
]

export function getYearFromTurn (turn: number): number {
  // Start from the first configured era
  if (turn <= 0) return yearsPerTurnConfig[0].start

  let remainingTurns = turn

  for (const era of yearsPerTurnConfig) {
    const yearsInEra = era.end - era.start
    const turnsInEra = yearsInEra / era.yearsPerTurn

    if (remainingTurns >= turnsInEra) {
      // Consume this whole era's turns and continue to the next
      remainingTurns -= turnsInEra
      continue
    }

    // We are within this era
    return era.start + remainingTurns * era.yearsPerTurn
  }

  // Fallback: if for some reason we exceeded the configuration,
  // continue using the last era's yearsPerTurn indefinitely
  const last = yearsPerTurnConfig[yearsPerTurnConfig.length - 1]
  return last.start + remainingTurns * last.yearsPerTurn
}

export function formatYear (year: number): string {
  const fullYear = Math.round(year)
  if (fullYear < 0) return `${-fullYear} BCE`
  // Switch to just the year at year 1000
  if (fullYear < 1000) return `${-fullYear} CE`

  // Switch to seasons at the year 1950 (starts to have half/third years)
  if (fullYear < 1950) return `${-fullYear}`

  // Round to season based on fractional part of the year
  //  .875 to .125 = Winter
  //  .125 to .375 = Spring
  //  .375 to .625 = Summer
  //  .625 to .875 = Autumn
  // Compute a positive fractional part in [0, 1)
  const fracRaw = year - Math.floor(year)
  const frac = ((fracRaw % 1) + 1) % 1

  let season: string
  if (frac >= 0.875 || frac < 0.125) season = 'Winter'
  else if (frac < 0.375) season = 'Spring'
  else if (frac < 0.625) season = 'Summer'
  else season = 'Autumn'

  return `${season} ${fullYear}`
}

export function roundToTenth (v: number): number {
  return Math.round(v * 10) / 10
}
