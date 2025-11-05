import { ObjectIcon, PohObject, TypeStorage } from '@/types/common'
import { GameObject } from '@/types/gameObjects'
import { useObjectsStore } from '@/stores/objects'
import { TypeObject } from '@/types/typeObjects'

const objects = useObjectsStore()

export interface PlayerDetails extends PohObject {
  isCurrent: boolean
  research: Research
  culture: Culture
  diplomacy: Diplomacy
  government: Government
  stateReligion?: string
  cities: string[]
  tradeRoutes: string[]
  units: string[]
  unitDesigns: string[]
  resourceStorage: TypeStorage
  yieldStorage: TypeStorage
}

export interface CurrentPlayer extends PlayerDetails {
  isCurrent: true
  research: MyResearch
  government: MyGovernment
}

export function initPlayer (data: GameObject): PlayerDetails | CurrentPlayer {
  const knownTechs = [] as TypeObject[]
  for (const techKey of data.technologies ?? []) {
    const tech = objects.gameObject(techKey)
    if (tech.isResearched) {
      knownTechs.push(tech.type!)
    }
  }

  const player = {
    ...data,
    isCurrent: data.isCurrent ?? false,
    research: {
      known: knownTechs,
    },
    culture: {
      heritages: [],
      traits: [],
      ...objects.gameObject(data.culture!),
    },
    diplomacy: {
      relations: {} as Record<string, PlayerRelation>,
      deals: [],
    },
    government: {
      policies: [],
      agenda: [],
    },

    stateReligion: data.religion,
    cities: data.cities ?? [],
    tradeRoutes: data.tradeRoutes ?? [],
    units: data.units ?? [],
    unitDesigns: data.unitDesigns ?? [],
    resourceStorage: new TypeStorage().load(data.resourceStorage ?? {}),
    yieldStorage: new TypeStorage().load(data.yieldStorage ?? {}),
  } as PlayerDetails | CurrentPlayer

  if (player.isCurrent) {
    return initCurrentPlayer(player, data)
  }

  return player
}

function initCurrentPlayer (player: PlayerDetails, data: GameObject): CurrentPlayer {
  const currentPlayer = player as CurrentPlayer

  // MyResearch
  currentPlayer.research.current = data.currentResearch ?? null
  currentPlayer.research.amounts = {} as Record<string, number>
  for (const techKey of data.technologies ?? []) {
    const tech = objects.gameObject(techKey)
    if (!tech.isResearched) {
      currentPlayer.research.amounts[tech.key] = tech.researchedAmount ?? 0
    }
  }

  // MyGovernment
  currentPlayer.government.electionsOnTurn = data.electionsOnTurn ?? null
  currentPlayer.government.policyUnhappiness = data.policyUnhappiness ?? 0
  currentPlayer.government.corruptionDisorder = data.corruptionDisorder ?? 0

  return currentPlayer
}

export interface Research {
  known: TypeObject[]
}

export interface MyResearch extends Research {
  current: string | null
  amounts: Record<string, number>
}

export interface Culture {
  id: string
  class: string
  key: string
  name: string
  icon: ObjectIcon
  heritages: string[]
  traits: string[]
}

export interface Diplomacy {
  relations: Record<string, PlayerRelation>
  deals: Deal[]
}

export interface PlayerRelation {
  trust: { amount: number, from: string }[]
  friendship: { amount: number, from: string }[]
  strength: number
  distance: number
}

export interface Deal {
  id: string
  class: string
  key: string
  startTurn: number
  endTurn: number
  items: {
    to: string
    from: string
    type: string
    amount: number
    value: number
  }[]
}

export interface Government {
  policies: string[]
  agenda: Agenda[]
}

export interface MyGovernment extends Government {
  electionsOnTurn: number | null
  policyUnhappiness: number
  corruptionDisorder: number
}

export interface Agenda {
  name: string
  size: string
  startTurn: number
  endTurn: number
  goals: {
    key: string
    requiredAmount: number
    currentAmount: number
  }[]
}