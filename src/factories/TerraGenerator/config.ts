import { TypeClass, TypeObject } from "@/types/typeObjects";
import { GenTile } from "@/factories/TerraGenerator/gen-tile";
import { TypeKey } from "@/types/common";

export type ContinentData = {
  type: TypeObject;
  center: GenTile;
  majorStarts: { strat: GenTile[]; reg: GenTile[]; game: GenTile[] };
  minorStarts: { strat: GenTile[]; reg: GenTile[]; game: GenTile[] };
};

export const climateBands = [
  ["climateType:frozen"],
  ["climateType:frozen", "climateType:cold"],
  ["climateType:cold", "climateType:temperate"],
  ["climateType:temperate", "climateType:temperate", "climateType:warm"],
  ["climateType:temperate", "climateType:warm"],
  ["climateType:warm"],
  ["climateType:hot"],
  ["climateType:hot", "climateType:hot", "climateType:warm"],
  ["climateType:warm", "climateType:equatorial"],
  ["climateType:equatorial"],
  ["climateType:equatorial", "climateType:warm"],
  ["climateType:warm", "climateType:cold"],
  ["climateType:cold", "climateType:frozen"],
  ["climateType:frozen"],
] as TypeKey[][];

// Wrap climate bands in a function allowing Y flip
export function getClimateBands(flipY: boolean): TypeKey[][] {
  return flipY ? [...climateBands].reverse() : climateBands;
}

export const climateTerrain = {
  "climateType:frozen": "terrainType:snow",
  "climateType:cold": "terrainType:tundra",
  "climateType:temperate": "terrainType:grass",
  "climateType:warm": "terrainType:plains",
  "climateType:hot": "terrainType:desert",
  "climateType:equatorial": "terrainType:grass",
} as Record<TypeKey, TypeKey>;

// The top and bottom rows are ocean
export const yTypes = {
  0: "oceanType:arctic",

  13: "oceanType:antarctic",
} as Record<number, TypeKey>;

// Wrap yTypes in a function allowing Y flip
export function getYTypes(stratHeight: number, flipY: boolean): Record<number, TypeKey> {
  if (!flipY) return yTypes;
  const out: Record<number, TypeKey> = {};
  const max = stratHeight - 1;
  for (const [k, v] of Object.entries(yTypes)) {
    const y = Number(k);
    out[max - y] = v;
  }
  return out;
}

// The left and right columns are ocean; so is the middle
export const xTypes = {
  0: "oceanType:pacific",

  11: "oceanType:atlantic",
  12: "oceanType:atlantic",

  27: "oceanType:pacific",
} as Record<number, TypeKey>;

// Wrap xTypes in a function allowing X flip
export function getXTypes(stratWidth: number, flipX: boolean): Record<number, TypeKey> {
  if (!flipX) return xTypes;
  const out: Record<number, TypeKey> = {};
  const max = stratWidth - 1;
  for (const [k, v] of Object.entries(xTypes)) {
    const x = Number(k);
    out[max - x] = v;
  }
  return out;
}

// Set continents and fine-tune oceans/seas
export const yxTypes = {
  1: {
    1: "oceanType:pacific",

    26: "oceanType:pacific",
  },
  2: {
    13: "oceanType:atlantic",
    15: "continentType",
  },
  3: {
    1: "oceanType:pacific",

    7: "continentType",

    19: "continentType",

    26: "oceanType:pacific",
  },
  4: {
    3: "continentType",

    13: "oceanType:atlantic",
  },
  5: {
    1: "oceanType:pacific",

    13: "oceanType:atlantic", // med is attached to atlantic
    14: "oceanType:mediterranean",
    15: "oceanType:mediterranean",
    16: "oceanType:mediterranean",
    17: "oceanType:mediterranean",
    18: "oceanType:mediterranean",
    19: "oceanType:mediterranean",

    24: "continentType",
    26: "oceanType:pacific",
  },
  6: {
    13: "oceanType:atlantic",
  },
  7: {
    1: "oceanType:pacific",

    4: "oceanType:caribbean",
    5: "oceanType:caribbean",
    6: "oceanType:caribbean",
    7: "oceanType:caribbean",
    8: "oceanType:caribbean",
    9: "oceanType:caribbean",
    10: "oceanType:atlantic", // carib is attached to atlantic

    26: "oceanType:pacific",
  },
  8: {
    13: "oceanType:atlantic",

    20: "continentType",
  },
  9: {
    1: "oceanType:pacific",

    4: "continentType",

    16: "continentType",

    26: "oceanType:pacific",
  },
  10: {
    8: "continentType",

    13: "oceanType:atlantic",

    18: "oceanType:indian",
    19: "oceanType:indian",
    20: "oceanType:indian",
    21: "oceanType:indian",
  },
  11: {
    1: "oceanType:pacific",

    18: "oceanType:indian",
    19: "oceanType:indian",
    20: "oceanType:indian",
    21: "oceanType:indian",

    24: "continentType",
    26: "oceanType:pacific",
  },
  12: {
    13: "oceanType:atlantic",

    18: "oceanType:indian",
    19: "oceanType:indian",
    20: "oceanType:indian",
    21: "oceanType:indian",
  },
} as Record<number, Record<number, TypeClass | TypeKey>>;

// Wrap yxTypes in a function allowing X/Y flips
export function getYXTypes(
  stratWidth: number,
  stratHeight: number,
  flipY: boolean,
  flipX: boolean,
): Record<number, Record<number, TypeClass | TypeKey>> {
  if (!flipY && !flipX) return yxTypes;
  const out: Record<number, Record<number, TypeClass | TypeKey>> = {};
  const maxY = stratHeight - 1;
  const maxX = stratWidth - 1;
  for (const [yStr, row] of Object.entries(yxTypes)) {
    const y = Number(yStr);
    const ny = flipY ? maxY - y : y;
    out[ny] = out[ny] ?? {};
    for (const [xStr, v] of Object.entries(row)) {
      const x = Number(xStr);
      const nx = flipX ? maxX - x : x;
      out[ny][nx] = v;
    }
  }
  return out;
}
