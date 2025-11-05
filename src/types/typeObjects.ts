// Type object definitions (encyclopedia/types dataset)
import { initPohObject, PohObject, Yield } from './common'

export type TypeClass =
  'actionType' |
  'buildingType' |
  'climateType' |
  'conceptType' |
  'continentType' |
  'dogmaType' |
  'domainType' |
  'elevationType' |
  'equipmentType' |
  'eraType' |
  'eventType' |
  'featureType' |
  'goalType' |
  'godType' |
  'heritageType' |
  'improvementType' |
  'majorCultureType' |
  'majorLeaderType' |
  'minorCultureType' |
  'minorLeaderType' |
  'mythType' |
  'nationalWonderType' |
  'naturalWonderType' |
  'oceanType' |
  'platformType' |
  'policyType' |
  'regionType' |
  'resourceType' |
  'routeType' |
  'specialType' |
  'stockpileType' |
  'technologyType' |
  'terrainType' |
  'traitType' |
  'worldWonderType' |
  'yieldType'

export type CategoryClass =
  'buildingCategory' |
  'equipmentCategory' |
  'goalCategory' |
  'godCategory' |
  'heritageCategory' |
  'improvementCategory' |
  'majorCultureCategory' |
  'majorLeaderCategory' |
  'minorCultureCategory' |
  'minorLeaderCategory' |
  'mythCategory' |
  'nationalWonderCategory' |
  'naturalWonderCategory' |
  'platformCategory' |
  'policyCategory' |
  'regionCategory' |
  'resourceCategory' |
  'stockpileCategory' |
  'technologyCategory' |
  'traitCategory' |
  'worldWonderCategory'

export interface CategoryObject extends PohObject {
  objType: 'CategoryObject',
  class: CategoryClass
  relatesTo: string[]
}

export interface TypeObject extends PohObject {
  objType: 'TypeObject'
  class: TypeClass
  description?: string
  audio?: string[]
  image?: string
  quote?: {
    text: string,
    source: string,
    url: string,
  }
  intro?: string
  p1?: string
  p2?: string
  x?: number
  y?: number
  category?: string
  allows: string[]
  requires: string[] | string[][]
  yields: Yield[]
  gains: string[]
  upgradesTo: string[]
  upgradesFrom: string[]
  specials: string[]
  relatesTo: string[]
}

export function initCategoryObject (data: any): CategoryObject {
  return initPohObject('CategoryObject', data) as CategoryObject
}

export function initTypeObject (data: any): TypeObject {
  const obj = initPohObject('TypeObject', {
    allows: [],
    requires: [],
    gains: [],
    upgradesFrom: [],
    upgradesTo: [],
    specials: [],
    relatesTo: [],
    yields: [],
    ...data
  }) as TypeObject

  // Fill yields with defaults
  for (const yieldObj of obj.yields) {
    if (!yieldObj.method) {
      yieldObj.method = 'lump'
    }
    if (!yieldObj.for) {
      yieldObj.for = []
    }
    if (!yieldObj.vs) {
      yieldObj.vs = []
    }
  }

  return obj
}