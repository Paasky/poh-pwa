import { Rng } from "@/Common/Helpers/Rng";
import { GenTile } from "@/Common/factories/TerraGenerator/gen-tile";
import {
  CompassHexEdge,
  CompassSquare,
  Coords,
  getHexNeighborDirections,
  getRealCoords,
} from "@/Common/Helpers/mapTools";

export type AcceptResult = boolean | "blocked";

// By default, prefer turning 60deg left or right
export const preferredPossibleTurnsHex: Record<CompassHexEdge, CompassHexEdge[]> = {
  ne: ["nw", "e"],
  e: ["ne", "se"],
  se: ["e", "sw"],
  sw: ["se", "w"],
  w: ["sw", "nw"],
  nw: ["w", "ne"],
};
// By default, prefer turning 45deg left or right
export const preferredPossibleTurnsSquare: Record<CompassSquare, CompassSquare[]> = {
  n: ["nw", "ne"],
  ne: ["n", "e"],
  e: ["ne", "se"],
  se: ["e", "s"],
  s: ["se", "sw"],
  sw: ["s", "w"],
  w: ["sw", "nw"],
  nw: ["w", "n"],
};

// By default, allow 90deg, 120deg turns or keep going straight
export const allPossibleTurnsHex: Record<CompassHexEdge, CompassHexEdge[]> = {
  ne: ["w", "nw", "ne", "e", "se"],
  e: ["nw", "ne", "e", "se", "sw"],
  se: ["ne", "e", "se", "sw", "w"],
  sw: ["e", "se", "sw", "w", "nw"],
  w: ["se", "sw", "w", "nw", "ne"],
  nw: ["sw", "w", "nw", "ne", "e"],
};
// By default, allow 90 & 45deg turns, or keep going straight
export const allPossibleTurnsSquare: Record<CompassSquare, CompassSquare[]> = {
  n: ["w", "nw", "n", "ne", "e"],
  ne: ["nw", "n", "ne", "e", "se"],
  e: ["n", "ne", "e", "se", "s"],
  se: ["ne", "e", "se", "s", "sw"],
  s: ["e", "se", "s", "sw", "w"],
  sw: ["se", "s", "sw", "w", "nw"],
  w: ["s", "sw", "w", "nw", "n"],
  nw: ["sw", "w", "nw", "n", "ne"],
};

// By default, deny turning back against the initial direction
export const impossibleTurnsPerInitDirHex: Record<CompassHexEdge, CompassHexEdge[]> = {
  ne: ["se"],
  e: ["w"],
  se: ["nw"],
  sw: ["ne"],
  w: ["e"],
  nw: ["se"],
};
// By default, deny turning back against the initial direction
export const impossibleTurnsPerInitDirSquare: Record<CompassSquare, CompassSquare[]> = {
  n: ["se", "s", "sw"],
  ne: ["s", "sw", "w"],
  e: ["sw", "w", "nw"],
  se: ["w", "nw", "n"],
  s: ["nw", "n", "ne"],
  sw: ["n", "ne", "e"],
  w: ["ne", "e", "se"],
  nw: ["e", "se", "s"],
};

// Hex direction coords depends on if y is odd/even
// These work on square grids
const directionCoordsChangesSquare = {
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
  nw: { x: -1, y: -1 },
} as Record<CompassSquare, { x: number; y: number }>;

export class Snake<T extends GenTile> {
  size: Coords;
  tiles: Record<string, T>;
  rng: Rng;
  method: "chebyshev" | "hex" = "hex";
  isAccepted?: (tile: T) => AcceptResult;
  onVisit: (tile: T) => boolean;

  initialDir: CompassSquare;
  legs = [2, 3];
  tilesPerLeg = [2, 3];
  preferredPossibleTurns: Record<string, string[]>;
  allPossibleTurns: Record<string, string[]>;
  impossibleTurnsPerInitDir: Record<string, string[]>;

  constructor(
    size: Coords,
    tiles: Record<string, T>,
    rng: Rng,
    onVisit: (tile: T) => boolean,
    isAccepted?: (tile: T) => AcceptResult,
    opts?: {
      allPossibleDirections?: Record<CompassSquare, CompassSquare[]>;
      impossibleTurns?: Record<CompassSquare, CompassSquare[]>;
      initialDir?: CompassSquare;
      legs?: number[];
      method?: "chebyshev" | "hex";
      possible45degTurns?: Record<CompassSquare, CompassSquare[]>;
      tilesPerLeg?: number[];
    },
  ) {
    this.size = size;
    this.tiles = tiles;
    this.rng = rng;
    this.isAccepted = isAccepted;
    this.onVisit = onVisit;

    if (this.method === "hex") {
      this.preferredPossibleTurns = preferredPossibleTurnsHex;
      this.allPossibleTurns = allPossibleTurnsHex;
      this.impossibleTurnsPerInitDir = impossibleTurnsPerInitDirHex;
    } else {
      this.preferredPossibleTurns = preferredPossibleTurnsSquare;
      this.allPossibleTurns = allPossibleTurnsSquare;
      this.impossibleTurnsPerInitDir = impossibleTurnsPerInitDirSquare;
    }

    this.initialDir =
      opts?.initialDir ??
      (this.rng.pick(Object.keys(this.preferredPossibleTurns)) as CompassSquare);
    if (opts?.legs) this.legs = opts.legs;
    if (opts?.tilesPerLeg) this.tilesPerLeg = opts.tilesPerLeg;
    if (opts?.possible45degTurns) this.preferredPossibleTurns = opts.possible45degTurns;
    if (opts?.allPossibleDirections) this.allPossibleTurns = opts.allPossibleDirections;
    if (opts?.impossibleTurns) this.impossibleTurnsPerInitDir = opts.impossibleTurns;
    if (opts?.method) this.method = opts.method;
  }

  walk(start: T): T[] {
    // Choose legs count
    const legsTotal = this.rng.pick(this.legs)!;
    let legsDone = 0;

    // Keep track of the previous tile & walked tiles
    const walkedTiles = [];
    let prevTile = null as T | null;
    let dir = this.initialDir;
    let halt = false;
    while (!halt || legsDone < legsTotal) {
      // Start a new leg: Choose the number of steps
      const steps = this.rng.pick(this.tilesPerLeg)!;

      // Walk the steps
      for (let i = 0; i < steps && !halt; i++) {
        if (halt) break;

        // Either: a) start or b) step into the direction
        let stepTile = !prevTile ? start : this.getNextTile(prevTile, this.method, dir);
        if (!stepTile) {
          halt = true;
          break;
        }

        // If an acceptor-func was given:
        // Check if this step is: a) accepted (true), b) 'blocked', or c) needs to halt (false)
        const accepted = !this.isAccepted || this.isAccepted(stepTile);
        if (!accepted) {
          halt = true;
          break;
        }

        if (accepted === "blocked") {
          if (!prevTile) {
            throw new Error("Starting tile was blocked");
          }

          // The chosen preferred direction is blocked -> try other directions
          const otherDirections = [...this.allPossibleTurns[dir]].filter(
            (d) => !this.impossibleTurnsPerInitDir[this.initialDir].includes(d),
          );

          const possibleTiles = [] as T[];
          otherDirections.forEach((d) => {
            const otherDirTile = this.getNextTile(prevTile!, this.method, d as CompassSquare);
            if (otherDirTile && this.isAccepted!(otherDirTile) === true)
              possibleTiles.push(otherDirTile);
          });

          // If any other tile is possible, pick a random one
          // NOTE: if nothing was possible, we will walk into the block
          if (possibleTiles.length > 0) {
            stepTile = this.rng.pick(possibleTiles)!;
          }
        }

        // Step accepted -> walk into it
        const keepGoing = this.onVisit(stepTile);
        walkedTiles.push(stepTile);
        prevTile = stepTile;
        if (!keepGoing) {
          halt = true;
          break;
        }
      }

      // End of leg

      if (halt) {
        break;
      } else {
        legsDone++;
        dir = this.rng.pick(
          this.preferredPossibleTurns[dir].filter(
            (d) => !impossibleTurnsPerInitDirSquare[this.initialDir].includes(d as CompassSquare),
          ),
        ) as CompassSquare;
      }
    }

    // All legs walked -> return the walked tiles
    return walkedTiles;
  }

  private getNextTile(
    tile: T,
    method: "hex" | "chebyshev",
    dir: CompassHexEdge | CompassSquare,
  ): T | null {
    const dirCoords =
      method === "hex"
        ? getHexNeighborDirections(tile.y)[dir as CompassHexEdge]
        : directionCoordsChangesSquare[dir];
    const nextCoords = getRealCoords(this.size, {
      x: tile.x + dirCoords.x,
      y: tile.y + dirCoords.y,
    });
    if (!nextCoords) return null;
    return this.tiles[GenTile.getKey(nextCoords.x, nextCoords.y)];
  }
}
