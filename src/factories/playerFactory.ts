import { Culture, GameObject, Player, Relation } from '@/types/gameObjects'
import { ObjKey, TypeStorage } from '@/types/common'
import { createCulture } from '@/factories/cultureFactory'
import { TypeObject } from '@/types/typeObjects'
import { createObject } from '@/factories/_gameObjectFactory'

export type PlayerBundle = {
  // Direct references for tests
  player: Player
  culture: Culture

  // All objects to persist in store
  toObjects (): GameObject[]
}

export const createPlayer = (
  name = '',
  isCurrent = false,
  relations: Record<ObjKey, Relation> = {},
  turnsToElection = 0,
  policyUnhappiness = 0,
  corruptionDisorder = 0,
  inRevolution = false,
  policies: TypeObject[] = [],
  research: {
    researched: TypeObject[]
    researching: Record<ObjKey, { type: TypeObject, progress: number }>
    current: TypeObject | null
    queue: TypeObject[]
  } = {
    researched: [],
    researching: {},
    current: null,
    queue: []
  },
  // If given, returns Player
  // If not given, returns PlayerBundle and creates a new Culture
  cultureKey?: ObjKey
): Player | PlayerBundle => {
  const base = createObject('player', name)

  const culture = cultureKey ? createCulture(base.key) : null

  const player = {
    ...base,

    // Player-specific defaults
    isCurrent,

    knownTiles: [],
    visibleTiles: [],
    ownedTiles: [],
    unitDesigns: [],
    units: [],
    cities: [],
    tradeRoutes: [],

    culture: culture ? culture.key : cultureKey,

    diplomacy: {
      deals: [],
      relations
    },
    government: {
      turnsToElection,
      hasElections: false,
      policyUnhappiness,
      corruptionDisorder,
      revolutionChance: 0,
      inRevolution,

      policies,
      selectablePolicies: [],
      agenda: []
    },
    research,

    resourceStorage: new TypeStorage(),
    stockpileStorage: new TypeStorage(),
    yieldStorage: new TypeStorage()
  } as Player

  return culture ? {
    player,
    culture,
    toObjects: () => [player, culture]
  } : player
}