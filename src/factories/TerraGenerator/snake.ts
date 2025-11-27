import { getRandom } from '@/helpers/arrayTools'
import { GenTile } from '@/factories/TerraGenerator/terraGenerator'

export type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

export const snake = (
  start: GenTile,
  tiles: Record<string, GenTile>,
  walkedTiles: GenTile[] = [],
  size: { x: number, y: number },
  legs: number[] = [3],
  tilesPerLeg: number[] = [3],
  acceptTile?: (tile: GenTile) => boolean,
  initialDir?: Compass
) => {
  const dirs = {
    n: { x: 0, y: -1 },
    ne: { x: 1, y: -1 },
    e: { x: 1, y: 0 },
    se: { x: 1, y: 1 },
    s: { x: 0, y: 1 },
    sw: { x: -1, y: 1 },
    w: { x: -1, y: 0 },
    nw: { x: -1, y: -1 }
  } as Record<Compass, { x: number, y: number }>

  // Start towards the equator
  let x = start.x
  let y = start.y
  walkedTiles.push(start)
  let legsDone = 0
  initialDir = initialDir ?? start.y < size.y / 2 ? 's' : 'n' as Compass
  let dir = initialDir

  const legsTotal = getRandom(legs)
  while (legsDone < legsTotal) {
    const tilesToWalk = getRandom(tilesPerLeg)
    for (let i = 0; i < tilesToWalk; i++) {
      // Walk
      x += dirs[dir].x
      y += dirs[dir].y

      const nextTile = tiles[GenTile.getKey(x, y)]
      if (!nextTile) break
      if (acceptTile?.(nextTile) === false) break

      walkedTiles.push(nextTile)
    }
    legsDone++

    dir = nextDir(dir, initialDir)
  }

  function nextDir (dir: Compass, initialDir: Compass): Compass {
    // Can turn 90 or 45 degrees
    const possibleTurns = {
      n: ['w', 'nw', 'ne', 'e'],
      ne: ['nw', 'n', 'e', 'se'],
      e: ['n', 'ne', 'se', 's'],
      se: ['ne', 'e', 's', 'sw'],
      s: ['e', 'se', 'sw', 'w'],
      sw: ['se', 's', 'w', 'nw'],
      w: ['s', 'sw', 'nw', 'n'],
      nw: ['sw', 'w', 'n', 'ne'],
    } as Record<Compass, Compass[]>

    // Never go against the initial dir (135+ deg against it)
    const impossibleTurns = {
      n: ['se', 's', 'sw'],
      ne: ['s', 'sw', 'w'],
      e: ['sw', 'w', 'nw'],
      se: ['w', 'nw', 'n'],
      s: ['nw', 'n', 'ne'],
      sw: ['n', 'ne', 'e'],
      w: ['ne', 'e', 'se'],
      nw: ['e', 'se', 's'],
    } as Record<Compass, Compass[]>

    const candidates = possibleTurns[dir].filter(
      pt => !impossibleTurns[initialDir].includes(pt)
    )

    return getRandom(candidates)
  }
}