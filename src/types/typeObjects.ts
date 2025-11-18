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
  getYield: (type: TypeKey) => Yield
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
    getYield: (type: TypeKey) => {
      const lump = obj.yields
        .filter(y => y.type === type && y.method === 'lump' && y.for.length === 0 && y.vs.length === 0)
        .reduce((acc, y) => acc + y.amount, 0)

      return { type, method: 'lump', amount: lump }
    },
    ...data
  }) as TypeObject

  // Fill yields with defaults
  for (const yieldObj of obj.yields ?? []) {
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

  // Add cost yields
  const costYieldTypes = [
    'yieldType:heritagePointCost',
    'yieldType:influenceCost',
    'yieldType:moveCost',
    'yieldType:productionCost',
    'yieldType:scienceCost'
  ] as TypeKey[]
  for (const type of costYieldTypes) {
    const costYield = obj.getYield(type)
    if (costYield.amount > 0) {
      obj[type.replace('yieldType:', '') as 'heritagePointCost' | 'influenceCost' | 'moveCost' | 'productionCost' | 'scienceCost'] = costYield.amount
    }
  }

  return obj
}