import { describe, it } from "vitest";
import { pointsInRing } from "../../../src/engine/TerrainMesh/pointsInRing";
import { expectFloatsToBeClose } from "../../_setup/testHelpers";

describe("pointsInRing", () => {
  it("K1 output", () => {
    expectFloatsToBeClose(pointsInRing(0, 1), validCenterData);
    expectFloatsToBeClose(pointsInRing(1, 1), validK1Data.ring1);
  });

  it("K2 output", () => {
    expectFloatsToBeClose(pointsInRing(0, 2), validCenterData);
    expectFloatsToBeClose(pointsInRing(1, 2), validK2Data.ring1);
    expectFloatsToBeClose(pointsInRing(2, 2), validK2Data.ring2);
  });

  it("K3 output", () => {
    expectFloatsToBeClose(pointsInRing(0, 3), validCenterData);
    expectFloatsToBeClose(pointsInRing(1, 3), validK3Data.ring1);
    expectFloatsToBeClose(pointsInRing(2, 3), validK3Data.ring2);
    expectFloatsToBeClose(pointsInRing(3, 3), validK3Data.ring3);
  });

  it("K4 output", () => {
    expectFloatsToBeClose(pointsInRing(0, 4), validCenterData);
    expectFloatsToBeClose(pointsInRing(1, 4), validK4Data.ring1);
    expectFloatsToBeClose(pointsInRing(2, 4), validK4Data.ring2);
    expectFloatsToBeClose(pointsInRing(3, 4), validK4Data.ring3);
    expectFloatsToBeClose(pointsInRing(4, 4), validK4Data.ring4);
  });
});

export const validCenterData = [{ x: 0, z: 0, ringNumFromCenter: 0 }];

/////////////////////////
// Valid data for each K
/////////////////////////

export const validK1Data = {
  ring1: [
    { x: 0, z: 1, ringNumFromCenter: 1, corner: "n" },
    { x: -Math.sqrt(3) / 2, z: 0.5, ringNumFromCenter: 1, corner: "nw" },
    { x: -Math.sqrt(3) / 2, z: -0.5, ringNumFromCenter: 1, corner: "sw" },
    { x: 0, z: -1, ringNumFromCenter: 1, corner: "s" },
    { x: Math.sqrt(3) / 2, z: -0.5, ringNumFromCenter: 1, corner: "se" },
    { x: Math.sqrt(3) / 2, z: 0.5, ringNumFromCenter: 1, corner: "ne" },
  ],
};

export const validK2Data = {
  ring1: [
    { x: 0, z: 0.5, ringNumFromCenter: 1, corner: "n" },
    { x: -Math.sqrt(3) / 4, z: 0.25, ringNumFromCenter: 1, corner: "nw" },
    { x: -Math.sqrt(3) / 4, z: -0.25, ringNumFromCenter: 1, corner: "sw" },
    { x: 0, z: -0.5, ringNumFromCenter: 1, corner: "s" },
    { x: Math.sqrt(3) / 4, z: -0.25, ringNumFromCenter: 1, corner: "se" },
    { x: Math.sqrt(3) / 4, z: 0.25, ringNumFromCenter: 1, corner: "ne" },
  ],
  ring2: [
    // N → NW edge (radius = 1, with one midpoint per edge)
    { x: 0, z: 1, ringNumFromCenter: 2, corner: "n" },
    { x: -0.433, z: 0.75, ringNumFromCenter: 2, edge: "nw" },
    // NW → SW edge
    { x: -0.866, z: 0.5, ringNumFromCenter: 2, corner: "nw" },
    { x: -0.866, z: 0, ringNumFromCenter: 2, edge: "w" },
    // SW → S edge
    { x: -0.866, z: -0.5, ringNumFromCenter: 2, corner: "sw" },
    { x: -0.433, z: -0.75, ringNumFromCenter: 2, edge: "sw" },
    // S → SE edge
    { x: 0, z: -1, ringNumFromCenter: 2, corner: "s" },
    { x: 0.433, z: -0.75, ringNumFromCenter: 2, edge: "se" },
    // SE → NE edge
    { x: 0.866, z: -0.5, ringNumFromCenter: 2, corner: "se" },
    { x: 0.866, z: 0, ringNumFromCenter: 2, edge: "e" },
    // NE → N edge
    { x: 0.866, z: 0.5, ringNumFromCenter: 2, corner: "ne" },
    { x: 0.433, z: 0.75, ringNumFromCenter: 2, edge: "ne" },
  ],
};

export const validK3Data = {
  ring1: [
    { x: 0, z: 1 / 3, ringNumFromCenter: 1, corner: "n" },
    { x: -(Math.sqrt(3) / 2) / 3, z: 0.5 / 3, ringNumFromCenter: 1, corner: "nw" },
    { x: -(Math.sqrt(3) / 2) / 3, z: -0.5 / 3, ringNumFromCenter: 1, corner: "sw" },
    { x: 0, z: -1 / 3, ringNumFromCenter: 1, corner: "s" },
    { x: Math.sqrt(3) / 2 / 3, z: -0.5 / 3, ringNumFromCenter: 1, corner: "se" },
    { x: Math.sqrt(3) / 2 / 3, z: 0.5 / 3, ringNumFromCenter: 1, corner: "ne" },
  ],

  ring2: [
    // radius = 2/3, one midpoint per edge
    { x: 0, z: 0.667, ringNumFromCenter: 2, corner: "n" },
    { x: -0.289, z: 0.5, ringNumFromCenter: 2, edge: "nw" },

    { x: -0.577, z: 0.333, ringNumFromCenter: 2, corner: "nw" },
    { x: -0.577, z: 0, ringNumFromCenter: 2, edge: "w" },

    { x: -0.577, z: -0.333, ringNumFromCenter: 2, corner: "sw" },
    { x: -0.289, z: -0.5, ringNumFromCenter: 2, edge: "sw" },

    { x: 0, z: -0.667, ringNumFromCenter: 2, corner: "s" },
    { x: 0.289, z: -0.5, ringNumFromCenter: 2, edge: "se" },

    { x: 0.577, z: -0.333, ringNumFromCenter: 2, corner: "se" },
    { x: 0.577, z: 0, ringNumFromCenter: 2, edge: "e" },

    { x: 0.577, z: 0.333, ringNumFromCenter: 2, corner: "ne" },
    { x: 0.289, z: 0.5, ringNumFromCenter: 2, edge: "ne" },
  ],

  ring3: [
    // radius = 1, two midpoints per edge
    // N side
    { x: 0, z: 1, ringNumFromCenter: 3, corner: "n" },
    { x: -0.289, z: 0.833, ringNumFromCenter: 3, edge: "nw" },
    { x: -0.577, z: 0.667, ringNumFromCenter: 3, edge: "nw" },

    // NW side
    { x: -0.866, z: 0.5, ringNumFromCenter: 3, corner: "nw" },
    { x: -0.866, z: 0.167, ringNumFromCenter: 3, edge: "w" },
    { x: -0.866, z: -0.167, ringNumFromCenter: 3, edge: "w" },

    // SW side
    { x: -0.866, z: -0.5, ringNumFromCenter: 3, corner: "sw" },
    { x: -0.577, z: -0.667, ringNumFromCenter: 3, edge: "sw" },
    { x: -0.289, z: -0.833, ringNumFromCenter: 3, edge: "sw" },

    // S side
    { x: 0, z: -1, ringNumFromCenter: 3, corner: "s" },
    { x: 0.289, z: -0.833, ringNumFromCenter: 3, edge: "se" },
    { x: 0.577, z: -0.667, ringNumFromCenter: 3, edge: "se" },

    // SE side
    { x: 0.866, z: -0.5, ringNumFromCenter: 3, corner: "se" },
    { x: 0.866, z: -0.167, ringNumFromCenter: 3, edge: "e" },
    { x: 0.866, z: 0.167, ringNumFromCenter: 3, edge: "e" },

    // NE side
    { x: 0.866, z: 0.5, ringNumFromCenter: 3, corner: "ne" },
    { x: 0.577, z: 0.667, ringNumFromCenter: 3, edge: "ne" },
    { x: 0.289, z: 0.833, ringNumFromCenter: 3, edge: "ne" },
  ],
};

export const validK4Data = {
  ring1: [
    { x: 0, z: 0.25, ringNumFromCenter: 1, corner: "n" },
    { x: -0.217, z: 0.125, ringNumFromCenter: 1, corner: "nw" },
    { x: -0.217, z: -0.125, ringNumFromCenter: 1, corner: "sw" },
    { x: 0, z: -0.25, ringNumFromCenter: 1, corner: "s" },
    { x: 0.217, z: -0.125, ringNumFromCenter: 1, corner: "se" },
    { x: 0.217, z: 0.125, ringNumFromCenter: 1, corner: "ne" },
  ],

  ring2: [
    // radius = 1/2, one midpoint per edge
    { x: 0, z: 0.5, ringNumFromCenter: 2, corner: "n" },
    { x: -0.217, z: 0.375, ringNumFromCenter: 2, edge: "nw" },

    { x: -0.433, z: 0.25, ringNumFromCenter: 2, corner: "nw" },
    { x: -0.433, z: 0, ringNumFromCenter: 2, edge: "w" },

    { x: -0.433, z: -0.25, ringNumFromCenter: 2, corner: "sw" },
    { x: -0.217, z: -0.375, ringNumFromCenter: 2, edge: "sw" },

    { x: 0, z: -0.5, ringNumFromCenter: 2, corner: "s" },
    { x: 0.217, z: -0.375, ringNumFromCenter: 2, edge: "se" },

    { x: 0.433, z: -0.25, ringNumFromCenter: 2, corner: "se" },
    { x: 0.433, z: 0, ringNumFromCenter: 2, edge: "e" },

    { x: 0.433, z: 0.25, ringNumFromCenter: 2, corner: "ne" },
    { x: 0.217, z: 0.375, ringNumFromCenter: 2, edge: "ne" },
  ],

  // ------- RING 3 (radius = 3/4) -------
  ring3: [
    // radius = 3/4, two midpoints per edge
    // N side
    { x: 0, z: 0.75, ringNumFromCenter: 3, corner: "n" },
    { x: -0.217, z: 0.625, ringNumFromCenter: 3, edge: "nw" },
    { x: -0.433, z: 0.5, ringNumFromCenter: 3, edge: "nw" },

    // NW side
    { x: -0.65, z: 0.375, ringNumFromCenter: 3, corner: "nw" },
    { x: -0.65, z: 0.125, ringNumFromCenter: 3, edge: "w" },
    { x: -0.65, z: -0.125, ringNumFromCenter: 3, edge: "w" },

    // SW side
    { x: -0.65, z: -0.375, ringNumFromCenter: 3, corner: "sw" },
    { x: -0.433, z: -0.5, ringNumFromCenter: 3, edge: "sw" },
    { x: -0.217, z: -0.625, ringNumFromCenter: 3, edge: "sw" },

    // S side
    { x: 0, z: -0.75, ringNumFromCenter: 3, corner: "s" },
    { x: 0.217, z: -0.625, ringNumFromCenter: 3, edge: "se" },
    { x: 0.433, z: -0.5, ringNumFromCenter: 3, edge: "se" },

    // SE side
    { x: 0.65, z: -0.375, ringNumFromCenter: 3, corner: "se" },
    { x: 0.65, z: -0.125, ringNumFromCenter: 3, edge: "e" },
    { x: 0.65, z: 0.125, ringNumFromCenter: 3, edge: "e" },

    // NE side
    { x: 0.65, z: 0.375, ringNumFromCenter: 3, corner: "ne" },
    { x: 0.433, z: 0.5, ringNumFromCenter: 3, edge: "ne" },
    { x: 0.217, z: 0.625, ringNumFromCenter: 3, edge: "ne" },
  ],

  // ------- RING 4 (radius = full = 1) -------
  ring4: [
    // radius = 1, three midpoints per edge
    // N side (corner + 3 edges)
    { x: 0, z: 1, ringNumFromCenter: 4, corner: "n" },
    { x: -0.217, z: 0.875, ringNumFromCenter: 4, edge: "nw" },
    { x: -0.433, z: 0.75, ringNumFromCenter: 4, edge: "nw" },
    { x: -0.65, z: 0.625, ringNumFromCenter: 4, edge: "nw" },

    // NW side
    { x: -0.866, z: 0.5, ringNumFromCenter: 4, corner: "nw" },
    { x: -0.866, z: 0.25, ringNumFromCenter: 4, edge: "w" },
    { x: -0.866, z: 0, ringNumFromCenter: 4, edge: "w" },
    { x: -0.866, z: -0.25, ringNumFromCenter: 4, edge: "w" },

    // SW side
    { x: -0.866, z: -0.5, ringNumFromCenter: 4, corner: "sw" },
    { x: -0.65, z: -0.625, ringNumFromCenter: 4, edge: "sw" },
    { x: -0.433, z: -0.75, ringNumFromCenter: 4, edge: "sw" },
    { x: -0.217, z: -0.875, ringNumFromCenter: 4, edge: "sw" },

    // S side
    { x: 0, z: -1, ringNumFromCenter: 4, corner: "s" },
    { x: 0.217, z: -0.875, ringNumFromCenter: 4, edge: "se" },
    { x: 0.433, z: -0.75, ringNumFromCenter: 4, edge: "se" },
    { x: 0.65, z: -0.625, ringNumFromCenter: 4, edge: "se" },

    // SE side
    { x: 0.866, z: -0.5, ringNumFromCenter: 4, corner: "se" },
    { x: 0.866, z: -0.25, ringNumFromCenter: 4, edge: "e" },
    { x: 0.866, z: 0, ringNumFromCenter: 4, edge: "e" },
    { x: 0.866, z: 0.25, ringNumFromCenter: 4, edge: "e" },

    // NE side
    { x: 0.866, z: 0.5, ringNumFromCenter: 4, corner: "ne" },
    { x: 0.65, z: 0.625, ringNumFromCenter: 4, edge: "ne" },
    { x: 0.433, z: 0.75, ringNumFromCenter: 4, edge: "ne" },
    { x: 0.217, z: 0.875, ringNumFromCenter: 4, edge: "ne" },
  ],
};
