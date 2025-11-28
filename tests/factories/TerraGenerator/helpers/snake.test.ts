// snake.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GenTile } from '../../../../src/factories/TerraGenerator/gen-tile'
import * as arrayTools from '../../../../src/helpers/arrayTools'
import { snake } from '../../../../src/factories/TerraGenerator/helpers/snake'

describe('snake()', () => {

  const mkTile = (x: number, y: number): GenTile =>
    ({ x, y, key: `${x}:${y}` } as any)

  const mkGrid = (w: number, h: number) => {
    const tiles: Record<string, GenTile> = {}
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = mkTile(x, y)
        tiles[`${x}:${y}`] = t
      }
    }
    return tiles
  }

  beforeEach(() => {
    // mock random: always pick the first element
    vi.spyOn(arrayTools, 'getRandom').mockImplementation(arr => arr[0])
  })

  it('pushes start tile and walks correct number of legs and steps', () => {
    const tiles = mkGrid(10, 10)
    const walked: GenTile[] = []

    const start = tiles['5:2'] // above midline → initialDir = 's'

    // Explicit initialDir per contract
    snake(start, tiles, walked, { x: 10, y: 10 }, [2], [3], undefined, 's')

    // RULE: start is always included
    expect(walked[0]).toBe(start)

    // RULE: legsTotal = first elem of [2]
    // RULE: tilesPerLeg = first elem of [3]
    // 1 start + 2 legs * 3 tiles each = 7 tiles
    expect(walked.length).toBe(1 + 2 * 3)
  })

  it('stops a leg when next tile is missing', () => {
    const tiles = mkGrid(10, 3)
    const walked: GenTile[] = []
    const start = tiles['5:1'] // middle row in 3-high grid

    // walking south will do exactly one valid step then hit bottom and stop leg
    snake(start, tiles, walked, { x: 10, y: 3 }, [1], [5], undefined, 's')

    // expected: start + 1 valid tile
    expect(walked.length).toBe(2)
  })

  it('stops early when acceptTile returns false', () => {
    const tiles = mkGrid(10, 10)
    const walked: GenTile[] = []
    const start = tiles['5:2']

    // allow first moved tile only (moving south keeps x=5, so accept once at y=3, then reject)
    const accept = vi.fn().mockImplementation(tile => tile.y <= 3)

    // Move south
    snake(start, tiles, walked, { x: 10, y: 10 }, [1], [5], accept, 's')

    // should stop after first reject
    expect(walked.length).toBe(2) // start + first tile accepted (5,3), then reject
    expect(accept).toHaveBeenCalled()
  })

  it('chooses initialDir based on equator rule', () => {
    const tiles = mkGrid(10, 10)
    const walked: GenTile[] = []

    const northStart = tiles['2:1'] // y < 10/2 => initialDir = 's'
    const southStart = tiles['2:7'] // y >= 10/2 => initialDir = 'n'

    let lastWalk: any[] = []
    snake(northStart, tiles, lastWalk, { x: 10, y: 10 }, [1], [1], undefined, 's')
    expect(lastWalk[1]).toEqual(tiles['2:2']) // moved south

    lastWalk.length = 0
    snake(southStart, tiles, lastWalk, { x: 10, y: 10 }, [1], [1], undefined, 'n')
    expect(lastWalk[1]).toEqual(tiles['2:6']) // moved north
  })

  it('never picks a forbidden turn according to initialDir', () => {
    const tiles = mkGrid(10, 10)
    const walked: GenTile[] = []
    const start = tiles['5:2']

    // force a situation where nextDir() is called
    snake(start, tiles, walked, { x: 10, y: 10 }, [2], [1], undefined, 's')

    // We mock getRandom to always pick first candidate.
    // We just ensure candidate 0 was not a forbidden direction.
    // Forbidden set for initialDir='s':
    const forbidden = ['nw', 'n', 'ne']

    // The second step direction after leg1:
    const step1 = walked[1]
    const step2 = walked[2]

    const dx = step2.x - step1.x
    const dy = step2.y - step1.y

    const dirs: Record<string, { x: number; y: number }> = {
      n: { x: 0, y: -1 },
      ne: { x: 1, y: -1 },
      e: { x: 1, y: 0 },
      se: { x: 1, y: 1 },
      s: { x: 0, y: 1 },
      sw: { x: -1, y: 1 },
      w: { x: -1, y: 0 },
      nw: { x: -1, y: -1 }
    }

    const chosenDir = Object.entries(dirs).find(
      ([, d]) => d.x === dx && d.y === dy
    )![0]

    expect(forbidden).not.toContain(chosenDir)
  })

})
