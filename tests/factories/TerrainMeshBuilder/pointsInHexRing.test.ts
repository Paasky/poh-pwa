import { describe, expect, it } from 'vitest'
import { pointsInRing } from '../../../src/factories/TerrainMeshBuilder/pointsInRing'

describe('pointsInRing', () => {
  it('K1 output', () => {
    expect(pointsInRing(0, 1)).toEqual(validCenterData)
    expect(pointsInRing(1, 1)).toEqual(validK1Data.ring1)
  })

  it('K2 output', () => {
    expect(pointsInRing(0, 2)).toEqual(validCenterData)
    expect(pointsInRing(1, 2)).toEqual(validK2Data.ring1)
    expect(pointsInRing(2, 2)).toEqual(validK2Data.ring2)
  })

  it('K3 output', () => {
    expect(pointsInRing(0, 3)).toEqual(validCenterData)
    expect(pointsInRing(1, 3)).toEqual(validK3Data.ring1)
    expect(pointsInRing(2, 3)).toEqual(validK3Data.ring2)
    expect(pointsInRing(3, 3)).toEqual(validK3Data.ring3)
  })

  it('K4 output', () => {
    expect(pointsInRing(0, 4)).toEqual(validCenterData)
    expect(pointsInRing(1, 4)).toEqual(validK4Data.ring1)
    expect(pointsInRing(2, 4)).toEqual(validK4Data.ring2)
    expect(pointsInRing(3, 4)).toEqual(validK4Data.ring3)
    expect(pointsInRing(4, 4)).toEqual(validK4Data.ring4)
  })
})

export const validCenterData = [
  { x: 0, z: 0, ringNumFromCenter: 0 },
]

/////////////////////////
// Valid data for each K
/////////////////////////

export const validK1Data = {
  ring1: [
    { x: 0, z: 1, ringNumFromCenter: 1, corner: 'n' },
    { x: -Math.sqrt(3) / 2, z: 0.5, ringNumFromCenter: 1, corner: 'nw' },
    { x: -Math.sqrt(3) / 2, z: -0.5, ringNumFromCenter: 1, corner: 'sw' },
    { x: 0, z: -1, ringNumFromCenter: 1, corner: 's' },
    { x: Math.sqrt(3) / 2, z: -0.5, ringNumFromCenter: 1, corner: 'se' },
    { x: Math.sqrt(3) / 2, z: 0.5, ringNumFromCenter: 1, corner: 'ne' },
  ],
}

export const validK2Data = {
  ring1: [
    { x: 0, z: 0.5, ringNumFromCenter: 1, corner: 'n' },
    { x: -Math.sqrt(3) / 4, z: 0.25, ringNumFromCenter: 1, corner: 'nw' },
    { x: -Math.sqrt(3) / 4, z: -0.25, ringNumFromCenter: 1, corner: 'sw' },
    { x: 0, z: -0.5, ringNumFromCenter: 1, corner: 's' },
    { x: Math.sqrt(3) / 4, z: -0.25, ringNumFromCenter: 1, corner: 'se' },
    { x: Math.sqrt(3) / 4, z: 0.25, ringNumFromCenter: 1, corner: 'ne' },
  ],
  ring2: [
    // N → NW edge
    { x: 0, z: 1, ringNumFromCenter: 2, corner: 'n' },
    { x: -0.25 * Math.sqrt(3), z: 0.75, ringNumFromCenter: 2, edge: 'nw' },
    // NW → SW edge
    { x: -0.5 * Math.sqrt(3), z: 0.5, ringNumFromCenter: 2, corner: 'nw' },
    { x: -0.75 * Math.sqrt(3), z: 0.25, ringNumFromCenter: 2, edge: 'sw' },
    // SW → S edge
    { x: -Math.sqrt(3) / 2, z: 0, ringNumFromCenter: 2, corner: 'sw' },
    { x: -0.5 * Math.sqrt(3), z: -0.5, ringNumFromCenter: 2, edge: 's' },
    // S → SE edge
    { x: 0, z: -1, ringNumFromCenter: 2, corner: 's' },
    { x: 0.5 * Math.sqrt(3), z: -0.5, ringNumFromCenter: 2, edge: 'se' },
    // SE → NE edge
    { x: Math.sqrt(3) / 2, z: -0.5, ringNumFromCenter: 2, corner: 'se' },
    { x: 0.75 * Math.sqrt(3), z: 0.25, ringNumFromCenter: 2, edge: 'ne' },
    // NE → N edge
    { x: Math.sqrt(3) / 2, z: 0.5, ringNumFromCenter: 2, corner: 'ne' },
    { x: 0.25 * Math.sqrt(3), z: 0.75, ringNumFromCenter: 2, edge: 'n' },
  ],
}

export const validK3Data = {
  ring1: [
    { x: 0, z: 1 / 3, ringNumFromCenter: 1, corner: 'n' },
    { x: -(Math.sqrt(3) / 2) / 3, z: (0.5) / 3, ringNumFromCenter: 1, corner: 'nw' },
    { x: -(Math.sqrt(3) / 2) / 3, z: (-0.5) / 3, ringNumFromCenter: 1, corner: 'sw' },
    { x: 0, z: -1 / 3, ringNumFromCenter: 1, corner: 's' },
    { x: (Math.sqrt(3) / 2) / 3, z: (-0.5) / 3, ringNumFromCenter: 1, corner: 'se' },
    { x: (Math.sqrt(3) / 2) / 3, z: (0.5) / 3, ringNumFromCenter: 1, corner: 'ne' },
  ],

  ring2: [
    // C, E, C, E, C, E, C, E, C, E, C, E
    { x: 0, z: 2 / 3, ringNumFromCenter: 2, corner: 'n' },
    { x: -(Math.sqrt(3) / 2) * (2 / 3) / 2, z: (0.5 * (2 / 3) + 2 / 3) / 2, ringNumFromCenter: 2, edge: 'nw' },

    { x: -(Math.sqrt(3) / 2) * (2 / 3), z: 0.5 * (2 / 3), ringNumFromCenter: 2, corner: 'nw' },
    {
      x: -(Math.sqrt(3) / 2) * (2 / 3),
      z: ((0.5 * (2 / 3) + -0.5 * (2 / 3)) / 2),
      ringNumFromCenter: 2,
      edge: 'sw'
    },

    { x: -(Math.sqrt(3) / 2) * (2 / 3), z: -0.5 * (2 / 3), ringNumFromCenter: 2, corner: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (2 / 3) / 2, z: (-0.5 * (2 / 3) + -2 / 3) / 2, ringNumFromCenter: 2, edge: 's' },

    { x: 0, z: -2 / 3, ringNumFromCenter: 2, corner: 's' },
    { x: (Math.sqrt(3) / 2) * (2 / 3) / 2, z: ((-2 / 3) + (-0.5 * (2 / 3))) / 2, ringNumFromCenter: 2, edge: 'se' },

    { x: (Math.sqrt(3) / 2) * (2 / 3), z: -0.5 * (2 / 3), ringNumFromCenter: 2, corner: 'se' },
    { x: (Math.sqrt(3) / 2) * (2 / 3), z: ((-0.5 * (2 / 3) + 0.5 * (2 / 3)) / 2), ringNumFromCenter: 2, edge: 'ne' },

    { x: (Math.sqrt(3) / 2) * (2 / 3), z: 0.5 * (2 / 3), ringNumFromCenter: 2, corner: 'ne' },
    { x: (Math.sqrt(3) / 2) * (2 / 3) / 2, z: ((0.5 * (2 / 3) + 2 / 3) / 2), ringNumFromCenter: 2, edge: 'n' },
  ],

  ring3: [
    // *** CORNER → EDGE → EDGE pattern (6 corners + 12 edges) ***

    // N side
    { x: 0, z: 1, ringNumFromCenter: 3, corner: 'n' },
    { x: -(Math.sqrt(3) / 2) / 3, z: (0.5 + 1 * 2) / 3, ringNumFromCenter: 3, edge: 'nw' },
    { x: -(Math.sqrt(3) / 2) * 2 / 3, z: (0.5 * 2 + 1) / 3, ringNumFromCenter: 3, edge: 'nw' },

    // NW side
    { x: -(Math.sqrt(3) / 2), z: 0.5, ringNumFromCenter: 3, corner: 'nw' },
    { x: -(Math.sqrt(3) / 2) * (1 + 2) / 3, z: (0.5 + -0.5 * 2) / 3, ringNumFromCenter: 3, edge: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (2 + 1) / 3, z: (-0.5 + 0.5 * 2) / 3, ringNumFromCenter: 3, edge: 'sw' },

    // SW side
    { x: -(Math.sqrt(3) / 2), z: -0.5, ringNumFromCenter: 3, corner: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (2 / 3), z: (-0.5 + -1 * 2) / 3, ringNumFromCenter: 3, edge: 's' },
    { x: -(Math.sqrt(3) / 2) * (1 / 3), z: (-1 + -0.5 * 2) / 3, ringNumFromCenter: 3, edge: 's' },

    // S side
    { x: 0, z: -1, ringNumFromCenter: 3, corner: 's' },
    { x: (Math.sqrt(3) / 2) / 3, z: (-1 + -0.5 * 2) / 3, ringNumFromCenter: 3, edge: 'se' },
    { x: (Math.sqrt(3) / 2) * 2 / 3, z: (-0.5 * 2 + -1) / 3, ringNumFromCenter: 3, edge: 'se' },

    // SE side
    { x: (Math.sqrt(3) / 2), z: -0.5, ringNumFromCenter: 3, corner: 'se' },
    { x: (Math.sqrt(3) / 2) * (1 + 2) / 3, z: (-0.5 + 0.5 * 2) / 3, ringNumFromCenter: 3, edge: 'ne' },
    { x: (Math.sqrt(3) / 2) * (2 + 1) / 3, z: (0.5 + -0.5 * 2) / 3, ringNumFromCenter: 3, edge: 'ne' },

    // NE side
    { x: (Math.sqrt(3) / 2), z: 0.5, ringNumFromCenter: 3, corner: 'ne' },
    { x: (Math.sqrt(3) / 2) / 3, z: (0.5 + 1 * 2) / 3, ringNumFromCenter: 3, edge: 'n' },
    { x: (Math.sqrt(3) / 2) * 2 / 3, z: (1 + 0.5 * 2) / 3, ringNumFromCenter: 3, edge: 'n' },
  ],
}

export const validK4Data = {
  ring1: [
    { x: 0, z: 1 / 4, ringNumFromCenter: 1, corner: 'n' },
    { x: -(Math.sqrt(3) / 2) * (1 / 4), z: 0.5 * (1 / 4), ringNumFromCenter: 1, corner: 'nw' },
    { x: -(Math.sqrt(3) / 2) * (1 / 4), z: -0.5 * (1 / 4), ringNumFromCenter: 1, corner: 'sw' },
    { x: 0, z: -1 / 4, ringNumFromCenter: 1, corner: 's' },
    { x: (Math.sqrt(3) / 2) * (1 / 4), z: -0.5 * (1 / 4), ringNumFromCenter: 1, corner: 'se' },
    { x: (Math.sqrt(3) / 2) * (1 / 4), z: 0.5 * (1 / 4), ringNumFromCenter: 1, corner: 'ne' },
  ],

  ring2: [
    // N side
    { x: 0, z: 2 / 4, ringNumFromCenter: 2, corner: 'n' },
    { x: -(Math.sqrt(3) / 2) * (2 / 4) / 2, z: (0.5 + 1) * (2 / 4) / 2, ringNumFromCenter: 2, edge: 'nw' },

    // NW side
    { x: -(Math.sqrt(3) / 2) * (2 / 4), z: 0.5 * (2 / 4), ringNumFromCenter: 2, corner: 'nw' },
    { x: -(Math.sqrt(3) / 2) * (2 / 4), z: ((0.5 * (2 / 4)) + -0.5 * (2 / 4)) / 2, ringNumFromCenter: 2, edge: 'w' },

    // SW side
    { x: -(Math.sqrt(3) / 2) * (2 / 4), z: -0.5 * (2 / 4), ringNumFromCenter: 2, corner: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (2 / 4) / 2, z: (-0.5 * (2 / 4) + -2 / 4) / 2, ringNumFromCenter: 2, edge: 'sw' },

    // S side
    { x: 0, z: -2 / 4, ringNumFromCenter: 2, corner: 's' },
    { x: (Math.sqrt(3) / 2) * (2 / 4) / 2, z: ((-2 / 4) + (-0.5 * (2 / 4))) / 2, ringNumFromCenter: 2, edge: 'se' },

    // SE side
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: -0.5 * (2 / 4), ringNumFromCenter: 2, corner: 'se' },
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: ((-0.5 * (2 / 4) + 0.5 * (2 / 4))) / 2, ringNumFromCenter: 2, edge: 'e' },

    // NE side
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: 0.5 * (2 / 4), ringNumFromCenter: 2, corner: 'ne' },
    { x: (Math.sqrt(3) / 2) * (2 / 4) / 2, z: ((0.5 * (2 / 4) + 2 / 4) / 2), ringNumFromCenter: 2, edge: 'ne' },
  ],

  // ------- RING 3 (radius = 3/4) -------
  ring3: [
    // N side
    { x: 0, z: 3 / 4, ringNumFromCenter: 3, corner: 'n' },
    { x: -(Math.sqrt(3) / 2) * (3 / 4) * (1 / 3), z: (0.5 + 2) * (3 / 4) * (1 / 3), ringNumFromCenter: 3, edge: 'nw' },
    {
      x: -(Math.sqrt(3) / 2) * (3 / 4) * (2 / 3),
      z: (0.5 * 2 + 1) * (3 / 4) * (1 / 3),
      ringNumFromCenter: 3,
      edge: 'nw'
    },

    // NW side
    { x: -(Math.sqrt(3) / 2) * (3 / 4), z: 0.5 * (3 / 4), ringNumFromCenter: 3, corner: 'nw' },
    {
      x: -(Math.sqrt(3) / 2) * (3 / 4) * (2 / 3),
      z: (0.5 + -0.5 * 2) * (3 / 4) * (1 / 3),
      ringNumFromCenter: 3,
      edge: 'w'
    },
    {
      x: -(Math.sqrt(3) / 2) * (3 / 4) * (1 / 3),
      z: (-0.5 + 0.5 * 2) * (3 / 4) * (1 / 3),
      ringNumFromCenter: 3,
      edge: 'w'
    },

    // SW side
    { x: -(Math.sqrt(3) / 2) * (3 / 4), z: -0.5 * (3 / 4), ringNumFromCenter: 3, corner: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (2 / 4), z: (-0.5 + -2) * (3 / 4) * (1 / 3), ringNumFromCenter: 3, edge: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (1 / 4), z: (-1 + -0.5 * 2) * (3 / 4) * (1 / 3), ringNumFromCenter: 3, edge: 'sw' },

    // S side
    { x: 0, z: -3 / 4, ringNumFromCenter: 3, corner: 's' },
    { x: (Math.sqrt(3) / 2) * (1 / 4), z: (-1 + -0.5 * 2) * (3 / 4) * (1 / 3), ringNumFromCenter: 3, edge: 'se' },
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: (-0.5 * 2 + -1) * (3 / 4) * (1 / 3), ringNumFromCenter: 3, edge: 'se' },

    // SE side
    { x: (Math.sqrt(3) / 2) * (3 / 4), z: -0.5 * (3 / 4), ringNumFromCenter: 3, corner: 'se' },
    {
      x: (Math.sqrt(3) / 2) * (3 / 4) * (2 / 3),
      z: (-0.5 + 0.5 * 2) * (3 / 4) * (1 / 3),
      ringNumFromCenter: 3,
      edge: 'e'
    },
    {
      x: (Math.sqrt(3) / 2) * (3 / 4) * (1 / 3),
      z: (0.5 + -0.5 * 2) * (3 / 4) * (1 / 3),
      ringNumFromCenter: 3,
      edge: 'e'
    },

    // NE side
    { x: (Math.sqrt(3) / 2) * (3 / 4), z: 0.5 * (3 / 4), ringNumFromCenter: 3, corner: 'ne' },
    { x: (Math.sqrt(3) / 2) * (1 / 4), z: (0.5 + 2) * (3 / 4) * (1 / 3), ringNumFromCenter: 3, edge: 'ne' },
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: (1 + 0.5 * 2) * (3 / 4) * (1 / 3), ringNumFromCenter: 3, edge: 'ne' },
  ],

  // ------- RING 4 (radius = full = 1) -------
  ring4: [
    // N side (corner + 3 edges)
    { x: 0, z: 1, ringNumFromCenter: 4, corner: 'n' },
    { x: -(Math.sqrt(3) / 2) * (1 / 4), z: (0.5 + 3 * 0.5) * (1 / 4), ringNumFromCenter: 4, edge: 'nw' },
    { x: -(Math.sqrt(3) / 2) * (2 / 4), z: (0.5 * 2 + 2) * (1 / 4), ringNumFromCenter: 4, edge: 'nw' },
    { x: -(Math.sqrt(3) / 2) * (3 / 4), z: (0.5 * 3 + 1) * (1 / 4), ringNumFromCenter: 4, edge: 'nw' },

    // NW side
    { x: -(Math.sqrt(3) / 2), z: 0.5, ringNumFromCenter: 4, corner: 'nw' },
    { x: -(Math.sqrt(3) / 2) * (3 / 4), z: (0.5 + -0.5 * 3) * (1 / 4), ringNumFromCenter: 4, edge: 'w' },
    { x: -(Math.sqrt(3) / 2) * (2 / 4), z: (0.5 + -0.5 * 2) * (1 / 4), ringNumFromCenter: 4, edge: 'w' },
    { x: -(Math.sqrt(3) / 2) * (1 / 4), z: (0.5 + -0.5 * 1) * (1 / 4), ringNumFromCenter: 4, edge: 'w' },

    // SW side
    { x: -(Math.sqrt(3) / 2), z: -0.5, ringNumFromCenter: 4, corner: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (3 / 4), z: (-0.5 + -1 * 3) * (1 / 4), ringNumFromCenter: 4, edge: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (2 / 4), z: (-0.5 + -1 * 2) * (1 / 4), ringNumFromCenter: 4, edge: 'sw' },
    { x: -(Math.sqrt(3) / 2) * (1 / 4), z: (-0.5 + -1 * 1) * (1 / 4), ringNumFromCenter: 4, edge: 'sw' },

    // S side
    { x: 0, z: -1, ringNumFromCenter: 4, corner: 's' },
    { x: (Math.sqrt(3) / 2) * (1 / 4), z: (-1 + -0.5 * 3) * (1 / 4), ringNumFromCenter: 4, edge: 'se' },
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: (-1 + -0.5 * 2) * (1 / 4), ringNumFromCenter: 4, edge: 'se' },
    { x: (Math.sqrt(3) / 2) * (3 / 4), z: (-1 + -0.5 * 1) * (1 / 4), ringNumFromCenter: 4, edge: 'se' },

    // SE side
    { x: (Math.sqrt(3) / 2), z: -0.5, ringNumFromCenter: 4, corner: 'se' },
    { x: (Math.sqrt(3) / 2) * (3 / 4), z: (-0.5 + 0.5 * 3) * (1 / 4), ringNumFromCenter: 4, edge: 'e' },
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: (-0.5 + 0.5 * 2) * (1 / 4), ringNumFromCenter: 4, edge: 'e' },
    { x: (Math.sqrt(3) / 2) * (1 / 4), z: (-0.5 + 0.5 * 1) * (1 / 4), ringNumFromCenter: 4, edge: 'e' },

    // NE side
    { x: (Math.sqrt(3) / 2), z: 0.5, ringNumFromCenter: 4, corner: 'ne' },
    { x: (Math.sqrt(3) / 2) * (3 / 4), z: (0.5 + 1 * 3) * (1 / 4), ringNumFromCenter: 4, edge: 'ne' },
    { x: (Math.sqrt(3) / 2) * (2 / 4), z: (0.5 + 1 * 2) * (1 / 4), ringNumFromCenter: 4, edge: 'ne' },
    { x: (Math.sqrt(3) / 2) * (1 / 4), z: (0.5 + 1 * 1) * (1 / 4), ringNumFromCenter: 4, edge: 'ne' },
  ]
}