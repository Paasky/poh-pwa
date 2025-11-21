import { Culture, GameObject, Player, Relation, Research } from '@/types/gameObjects'
import { EventSetting, EventType } from '@/types/events'
import { ObjKey, TypeStorage } from '@/types/common'
import { TypeObject } from '@/types/typeObjects'
import { createGameObject } from '@/factories/_gameObjectFactory'
import { createCulture } from '@/factories/cultureFactory'
import { CultureManager } from '@/managers/cultureManager'

export type PlayerBundle = {
  // Direct references for tests
  player: Player
  culture: Culture

  // All objects to persist in store
  toObjects (): GameObject[]
}

export const createPlayer = (
  name: string,
  cultureType: TypeObject,
  isCurrent = false,
  relations: Record<ObjKey, Relation> = {},
  turnsToElection = 0,
  policyUnhappiness = 0,
  corruptionDisorder = 0,
  inRevolution = false,
  religion?: ObjKey,
  policies: TypeObject[] = [],
  research: Research = {
    available: [],
    era: null,
    researched: [],
    researching: {},
    current: null,
    queue: [],
    turnsLeft: 0,
  },
): PlayerBundle => {
  const base = createGameObject('player', name)

  const culture = createCulture(base, cultureType)
  const leader = new CultureManager().getLeader(cultureType)
  const player = {
    ...base,
    isCurrent,
    leader,

    knownTypes: [] as TypeObject[],
    knownTiles: [] as ObjKey[],
    visibleTiles: [] as ObjKey[],
    ownedTiles: [] as ObjKey[],
    unitDesigns: [] as ObjKey[],
    units: [] as ObjKey[],
    cities: [] as ObjKey[],
    tradeRoutes: [] as ObjKey[],

    culture: culture.key,
    religion: religion ?? undefined,

    diplomacy: {
      deals: [] as ObjKey[],
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
      selectablePolicies: [] as TypeObject[],
      agenda: [] as ObjKey[]
    },
    research,

    resourceStorage: new TypeStorage(),
    stockpileStorage: new TypeStorage(),
    yieldStorage: new TypeStorage(),
    eventSettings: {
      'settled': 'full',
      'cultureEvolved': 'full',
    } as Record<EventType, EventSetting>
  } as Player

  return {
    culture,
    player,
    toObjects: (): GameObject[] => [player, culture]
  }
}