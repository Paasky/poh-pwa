import { getRandom } from '@/helpers/arrayTools'
import { GenTile } from '@/factories/TerraGenerator/gen-tile'
import { Tile } from '@/objects/gameObjects'
import { Coords, getRealCoords } from '@/factories/TerraGenerator/helpers/neighbors'

export type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

export type AcceptResult = boolean | 'blocked'

// By default, prefer turning 45deg left or right
export const preferredPossibleTurns: Record<Compass, Compass[]> = {
  n: ['nw', 'ne'],
  ne: ['n', 'e'],
  e: ['ne', 'se'],
  se: ['e', 's'],
  s: ['se', 'sw'],
  sw: ['s', 'w'],
  w: ['sw', 'nw'],
  nw: ['w', 'n'],
}

// By default, allow 90 & 45deg turns, or keep going straight
export const allPossibleTurns: Record<Compass, Compass[]> = {
  n: ['w', 'nw', 'n', 'ne', 'e'],
  ne: ['nw', 'n', 'ne', 'e', 'se'],
  e: ['n', 'ne', 'e', 'se', 's'],
  se: ['ne', 'e', 'se', 's', 'sw'],
  s: ['e', 'se', 's', 'sw', 'w'],
  sw: ['se', 's', 'sw', 'w', 'nw'],
  w: ['s', 'sw', 'w', 'nw', 'n'],
  nw: ['sw', 'w', 'nw', 'n', 'ne'],
}

// By default, deny turning back against the initial direction
export const impossibleTurnsPerInitDir: Record<Compass, Compass[]> = {
  n: ['se', 's', 'sw'],
  ne: ['s', 'sw', 'w'],
  e: ['sw', 'w', 'nw'],
  se: ['w', 'nw', 'n'],
  s: ['nw', 'n', 'ne'],
  sw: ['n', 'ne', 'e'],
  w: ['ne', 'e', 'se'],
  nw: ['e', 'se', 's'],
}

// These work on square grids
const directionCoordsChanges = {
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
  nw: { x: -1, y: -1 }
} as Record<Compass, { x: number, y: number }>

export class Snake<T extends GenTile> {
  size: Coords
  tiles: Record<string, T>
  isAccepted?: (tile: T) => AcceptResult
  onVisit: (tile: T) => boolean

  initialDir: Compass
  legs = [2, 3]
  tilesPerLeg = [2, 3]
  preferredPossibleTurns = preferredPossibleTurns
  allPossibleTurns = allPossibleTurns
  impossibleTurnsPerInitDir = impossibleTurnsPerInitDir

  constructor (
    size: Coords,
    tiles: Record<string, T>,
    onVisit: (tile: T) => boolean,
    isAccepted?: (tile: T) => AcceptResult,
    opts?: {
      initialDir?: Compass
      legs?: number[]
      tilesPerLeg?: number[]
      possible45degTurns?: Record<Compass, Compass[]>
      allPossibleDirections?: Record<Compass, Compass[]>
      impossibleTurns?: Record<Compass, Compass[]>
    }
  ) {
    this.size = size
    this.tiles = tiles
    this.isAccepted = isAccepted
    this.onVisit = onVisit

    this.initialDir = opts?.initialDir ?? getRandom(Object.keys(preferredPossibleTurns)) as Compass
    if (opts?.legs) this.legs = opts.legs
    if (opts?.tilesPerLeg) this.tilesPerLeg = opts.tilesPerLeg
    if (opts?.possible45degTurns) this.preferredPossibleTurns = opts.possible45degTurns
    if (opts?.allPossibleDirections) this.allPossibleTurns = opts.allPossibleDirections
    if (opts?.impossibleTurns) this.impossibleTurnsPerInitDir = opts.impossibleTurns
  }

  walk (start: T): T[] {
    // Choose legs count
    const legsTotal = getRandom(this.legs)
    let legsDone = 0

    // Keep track of the previous tile & walked tiles
    const walkedTiles = []
    let prevTile = null as T | null
    let dir = this.initialDir
    let halt = false
    while (!halt || legsDone < legsTotal) {
      // Start a new leg: Choose the number of steps
      const steps = getRandom(this.tilesPerLeg)

      // Walk the steps
      for (let i = 0; i < steps && !halt; i++) {
        if (halt) break

        // Either: a) start or b) step into the direction
        let stepTile = !prevTile ? start : this.getNextTile(prevTile, dir)
        if (!stepTile) {
          halt = true
          break
        }

        // If an acceptor-func was given:
        // Check if this step is: a) accepted (true), b) 'blocked', or c) needs to halt (false)
        const accepted = !this.isAccepted || this.isAccepted(stepTile)
        if (!accepted) {
          halt = true
          break
        }

        if (accepted === 'blocked') {
          if (!prevTile) {
            throw new Error('Starting tile was blocked')
          }

          // The chosen preferred direction is blocked -> try other directions
          const otherDirections = [...this.allPossibleTurns[dir]].filter(
            d => !this.impossibleTurnsPerInitDir[this.initialDir].includes(d)
          )

          const possibleTiles = [] as T[]
          otherDirections.forEach((d) => {
            const otherDirTile = this.getNextTile(prevTile!, d)
            if (otherDirTile && this.isAccepted!(otherDirTile) === true) possibleTiles.push(otherDirTile)
          })

          // If any other tile is possible, pick a random one
          // NOTE: if nothing was possible, we will walk into the block
          if (possibleTiles.length > 0) {
            stepTile = getRandom(possibleTiles)
          }
        }

        // Step accepted -> walk into it
        const keepGoing = this.onVisit(stepTile)
        walkedTiles.push(stepTile)
        prevTile = stepTile
        if (!keepGoing) {
          halt = true
          break
        }
      }

      // End of leg

      if (halt) {
        break
      } else {
        legsDone++
        dir = getRandom(this.preferredPossibleTurns[dir].filter(
          d => !impossibleTurnsPerInitDir[this.initialDir].includes(d)
        ))
      }
    }

    // All legs walked -> return the walked tiles
    return walkedTiles
  }

  private getNextTile (tile: T, dir: Compass): T | null {
    const nextCoords = getRealCoords(this.size, {
      x: tile.x + directionCoordsChanges[dir].x,
      y: tile.y + directionCoordsChanges[dir].y
    })
    if (!nextCoords) return null
    return this.tiles[Tile.getKey(nextCoords.x, nextCoords.y)]
  }
}