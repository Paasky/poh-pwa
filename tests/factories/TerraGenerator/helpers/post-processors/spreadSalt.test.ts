import { beforeEach, describe, expect, it } from "vitest";
import { spreadSalt } from "../../../../../src/factories/TerraGenerator/helpers/post-processors";
import { Tile } from "../../../../../src/objects/game/gameObjects";
import { initTestPinia, loadStaticData } from "../../../../_setup/pinia";

// Build a tiny graph of water tiles so crawlTiles will visit them
const mkWorld = () => {
  const mk = (x: number, y: number) => ({
    key: Tile.getKey(x, y),
    x,
    y,
    domain: { id: "water" },
    isSalt: false,
  });
  const a = mk(0, 0);
  const b = mk(1, 0);
  const c = mk(2, 0);
  const map: Record<string, any> = { [a.key]: a, [b.key]: b, [c.key]: c };
  const N: Record<string, any[]> = {
    [a.key]: [b],
    [b.key]: [a, c],
    [c.key]: [b],
  };
  const gen = {
    getGameNeighbors: (coords: { x: number; y: number }) =>
      N[Tile.getKey(coords.x, coords.y)] || [],
    getRegNeighbors: (coords: { x: number; y: number }) =>
      N[Tile.getKey(coords.x, coords.y)] || [],
    getStratNeighbors: (coords: { x: number; y: number }) =>
      N[Tile.getKey(coords.x, coords.y)] || [],
  };
  return { gen, start: a, tiles: [a, b, c] };
};

describe("spreadSalt", () => {
  beforeEach(() => {
    initTestPinia();
    loadStaticData();
  });

  it("marks all contiguous water tiles as salt", () => {
    const { gen, start, tiles } = mkWorld();
    spreadSalt(gen as any, "game", start as any);
    expect(tiles.every((t) => t.isSalt === true)).toBe(true);
  });

  it("finds its way through a 5x5 'spiral maze' of water tiles", () => {
    // Build spiral path coords
    const path: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [4, 1],
      [4, 2],
      [4, 3],
      [4, 4],
      [3, 4],
      [2, 4],
      [1, 4],
      [0, 4],
      [0, 3],
      [0, 2],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [3, 2],
      [3, 3],
      [2, 3],
      [1, 3],
      [1, 2],
      [2, 2], // center
    ];
    const mk = (x: number, y: number, water = false) => ({
      key: Tile.getKey(x, y),
      x,
      y,
      domain: { id: water ? "water" : "land" },
      isSalt: false,
    });
    const tiles: Record<string, any> = {};
    // Initialize all as land, then path as water
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) tiles[Tile.getKey(x, y)] = mk(x, y, false);
    }
    for (const [x, y] of path) tiles[Tile.getKey(x, y)] = mk(x, y, true);
    // Build adjacency map only along the spiral path
    const N: Record<string, any[]> = {};
    const setPair = (a: string, b: string) => {
      N[a] = N[a] || [];
      N[b] = N[b] || [];
      N[a].push(tiles[b]);
      N[b].push(tiles[a]);
    };
    for (let i = 0; i < path.length - 1; i++) {
      const a = Tile.getKey(path[i][0], path[i][1]);
      const b = Tile.getKey(path[i + 1][0], path[i + 1][1]);
      setPair(a, b);
    }
    const gen = {
      getGameNeighbors: (coords: { x: number; y: number }) =>
        N[Tile.getKey(coords.x, coords.y)] || [],
      getRegNeighbors: (coords: { x: number; y: number }) =>
        N[Tile.getKey(coords.x, coords.y)] || [],
      getStratNeighbors: (coords: { x: number; y: number }) =>
        N[Tile.getKey(coords.x, coords.y)] || [],
    };
    const start = tiles[Tile.getKey(0, 0)];
    spreadSalt(gen as any, "game", start as any);
    // All water in the spiral path should be salted
    for (const [x, y] of path)
      expect(tiles[Tile.getKey(x, y)].isSalt).toBe(true);
  });

  it("does not salt isolated water surrounded by land (3-ring 5x5)", () => {
    const mk = (x: number, y: number, water = false) => ({
      key: Tile.getKey(x, y),
      x,
      y,
      domain: { id: water ? "water" : "land" },
      isSalt: false,
    });
    const tiles: Record<string, any> = {};
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) tiles[Tile.getKey(x, y)] = mk(x, y, false);
    }
    // Only the center is water, completely enclosed by land
    tiles[Tile.getKey(2, 2)] = mk(2, 2, true);
    const N: Record<string, any[]> = {};
    const gen = {
      getGameNeighbors: (coords: { x: number; y: number }) =>
        N[Tile.getKey(coords.x, coords.y)] || [],
      getRegNeighbors: (coords: { x: number; y: number }) =>
        N[Tile.getKey(coords.x, coords.y)] || [],
      getStratNeighbors: (coords: { x: number; y: number }) =>
        N[Tile.getKey(coords.x, coords.y)] || [],
    };
    // No connections to center, start from top-left corner (land)
    spreadSalt(gen as any, "game", tiles[Tile.getKey(0, 0)] as any);
    expect(tiles[Tile.getKey(2, 2)].isSalt).toBe(false);
  });
});
