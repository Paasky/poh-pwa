import { useObjectsStore } from '@/stores/objectStore'
import { World } from '@/types/common'
import { Culture, Player } from '@/types/gameObjects'

export class WorldManager {
  private _objects = useObjectsStore()

  create (): WorldBundle {
    const bundle = {
      world: {
        id: crypto.randomUUID(),
        sizeX: 60,
        sizeY: 40,
        turn: 0,
        year: this.getYearFromTurn(0),
      } as World,
      objects: []
    }

    // Create first player (current)
    const player1: Player = {
      key: `player:${crypto.randomUUID()}`,
      objType: 'Player',
      isCurrent: true,
      name: 'Player 1',
      color: '#FF0000',
      culture: '',
    }

    // Create second player (non-current)
    const player2: Player = {
      key: `player:${crypto.randomUUID()}`,
      objType: 'Player',
      isCurrent: false,
      name: 'Player 2',
      color: '#0000FF',
      culture: '',
    }

    // Create cultures for players
    const culture1: Culture = {
      key: `culture:${crypto.randomUUID()}`,
      objType: 'Culture',
      owner: player1.key,
      name: 'Culture 1',
    }

    const culture2: Culture = {
      key: `culture:${crypto.randomUUID()}`,
      objType: 'Culture',
      owner: player2.key,
      name: 'Culture 2',
    }

    // Link cultures to players
    player1.culture = culture1.key
    player2.culture = culture2.key

    // Add all objects to bundle
    bundle.objects.push(player1, player2, culture1, culture2)

    return bundle
  }

  getYearFromTurn (turn: number): number {
    if (turn < 0) throw new Error('Turn cannot be negative')

    const config = [
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

    let remainingTurns = turn

    for (const seg of config) {
      const spanYears = seg.end - seg.start
      // How many turns cover this segment (ceil to include last partial turn)
      const turnsInSegment = Math.ceil(spanYears / seg.yearsPerTurn)

      // if the turn index falls inside this segment
      if (remainingTurns < turnsInSegment) {
        // compute year (floating)
        const yearFloat = seg.start + remainingTurns * seg.yearsPerTurn

        // clamp to segment end (avoid tiny FP overshoot). small epsilon to be safe:
        return Math.floor(Math.min(yearFloat, seg.end + Number.EPSILON))
      }

      remainingTurns -= turnsInSegment
    }

    // With the last segment open-ended, we should never get here.
    throw new Error(`Turn index ${turn} exceeds configured timeline`)
  }
}

export type WorldBundle = {
  world: World,
  objects: any[],
}