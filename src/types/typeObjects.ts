// Type object definitions (encyclopedia/types dataset)
import { CatKey, initPohObject, PohObject, TypeKey, Yield } from './common'

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
  key: CatKey
  relatesTo: TypeKey[]
}

export interface TypeObject extends PohObject {
  objType: 'TypeObject'
  class: TypeClass
  key: TypeKey
  category?: `${CategoryClass}:${string}`
  description?: string
  audio?: string[]
  image?: string
  quote?: {
    greeting: string,
    text: string,
    source: string,
    url: string,
  }
  intro?: string
  p1?: string
  p2?: string
  x?: number
  y?: number
  hotkey?: string
  moves?: number
  heritagePointCost?: number
  influenceCost?: number
  moveCost?: number
  productionCost?: number
  scienceCost?: number
  isPositive?: boolean
  names: Record<TypeKey, string>
  allows: TypeKey[]
  requires: TypeKey[] | TypeKey[][]
  yields: Yield[]
  gains: TypeKey[]
  upgradesTo: TypeKey[]
  upgradesFrom: TypeKey[]
  specials: TypeKey[]
  relatesTo: TypeKey[]
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

  if (data.key === 'regionType:aegean') {
    console.log(data, obj)
  }

  for (const yieldObj of obj.yields ?? []) {
    // Fill yields with defaults
    if (!yieldObj.method) {
      yieldObj.method = 'lump'
    }
    if (!yieldObj.for) {
      yieldObj.for = []
    }
    if (!yieldObj.vs) {
      yieldObj.vs = []
    }

    // Add costs directly into object
    if (yieldObj.method === 'lump' && ['heritagePointCost', 'influenceCost', 'moveCost', 'productionCost', 'scienceCost'].includes(yieldObj.type)) {
      obj[yieldObj.type as 'heritagePointCost' | 'influenceCost' | 'moveCost' | 'productionCost' | 'scienceCost'] = yieldObj.amount
    }
  }

  return obj
}