import { getRandom, takeRandom } from '@/helpers/arrayTools'
import { GenTile } from '@/factories/TerraGenerator/gen-tile'
import { Tile } from '@/objects/gameObjects'

type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

type AcceptResult = boolean | 'blocked'

export const snake = (
  start: GenTile,
  tiles: Record<string, GenTile>,
  walkedTiles: GenTile[] = [],
  size: { x: number, y: number },
  legs: number[] = [3],
  tilesPerLeg: number[] = [3],
  acceptTile?: (tile: GenTile) => AcceptResult,
  initialDir?: Compass,
  onVisit?: (tile: GenTile) => void,
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

  // Start at given tile
  let x = start.x
  let y = start.y
  walkedTiles.push(start)
  onVisit?.(start)
  let legsDone = 0
  // Respect provided initialDir if given; otherwise default away from equator
  initialDir = (initialDir ?? (start.y < size.y / 2 ? 's' : 'n')) as Compass
  let dir = initialDir

  const legsTotal = getRandom(legs)
  let halt = false
  const wrapX = (vx: number) => ((vx % size.x) + size.x) % size.x

  while (legsDone < legsTotal && !halt) {
    const tilesToWalk = getRandom(tilesPerLeg)
    for (let i = 0; i < tilesToWalk && !halt; i++) {
      // Compute next in current dir (don't move until accepted)
      const nx = wrapX(x + dirs[dir].x)
      const ny = y + dirs[dir].y

      // Stop if we smash against top/bottom (no Y wrap)
      if (ny < 0 || ny >= size.y) { halt = true; break }

      const nextTile = getByCoords(tiles, nx, ny)
      if (!nextTile) { halt = true; break }

      const res = acceptTile?.(nextTile)
      if (res === false) { halt = true; break }

      if (res === 'blocked') {
        // Try alternative directions in random order (avoid going against initial direction)
        const possibleTurns: Record<Compass, Compass[]> = {
          n: ['w', 'nw', 'ne', 'e'],
          ne: ['nw', 'n', 'e', 'se'],
          e: ['n', 'ne', 'se', 's'],
          se: ['ne', 'e', 's', 'sw'],
          s: ['e', 'se', 'sw', 'w'],
          sw: ['se', 's', 'w', 'nw'],
          w: ['s', 'sw', 'nw', 'n'],
          nw: ['sw', 'w', 'n', 'ne'],
        }
        const impossibleTurns: Record<Compass, Compass[]> = {
          n: ['se', 's', 'sw'],
          ne: ['s', 'sw', 'w'],
          e: ['sw', 'w', 'nw'],
          se: ['w', 'nw', 'n'],
          s: ['nw', 'n', 'ne'],
          sw: ['n', 'ne', 'e'],
          w: ['ne', 'e', 'se'],
          nw: ['e', 'se', 's'],
        }

        const candidates = possibleTurns[dir].filter(
          c => !impossibleTurns[initialDir].includes(c)
        ) as Compass[]

        // Random order using takeRandom()
        const pool = [...candidates]
        let found = false
        while (pool.length) {
          const cand = takeRandom(pool)
          const nx2 = wrapX(x + dirs[cand].x)
          const ny2 = y + dirs[cand].y
          if (ny2 < 0 || ny2 >= size.y) { continue }
          const next2 = getByCoords(tiles, nx2, ny2)
          if (!next2) continue
          const r2 = acceptTile?.(next2)
          if (r2 === false) { halt = true; break }
          if (r2 === 'blocked') continue
          // accept
          x = nx2; y = ny2
          walkedTiles.push(next2)
          onVisit?.(next2)
          found = true
          break
        }
        if (halt) break
        if (!found) {
          // Go through original blocked tile
          x = nx; y = ny
          walkedTiles.push(nextTile)
          onVisit?.(nextTile)
        }
        continue
      }

      // Accept normal step
      x = nx
      y = ny
      walkedTiles.push(nextTile)
      onVisit?.(nextTile)
    }
    if (!halt) {
      legsDone++
      dir = nextDir(dir, initialDir)
    }
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

  function getByCoords (map: Record<string, GenTile>, gx: number, gy: number): GenTile | undefined {
    // Try multiple key formats to be robust in tests and production
    const candidates = [
      // canonical tile key
      Tile.getKey(gx, gy),
      // gen-tile key (same as Tile.getKey in prod, but included for clarity)
      (GenTile as any).getKey ? (GenTile as any).getKey(gx, gy) : undefined,
      // terse formats used in unit tests
      `${gx}:${gy}`,
      `x${gx},y${gy}`,
      `[${gx},${gy}]`,
      // common "kX,Y" format used in tests
      `k${gx},${gy}`,
    ].filter(Boolean) as string[]
    for (const k of candidates) {
      const t = map[k]
      if (t) return t
    }
    return undefined
  }
}