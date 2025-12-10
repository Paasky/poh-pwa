import { Color4 } from "@babylonjs/core";
import { CompassHexCorner, CompassHexEdge } from "@/helpers/mapTools";

export type EngineCoords = {
  x: number;
  z: number;
};

export type HexMeshConf = {
  x: number;
  z: number;
  color: Color4;
  height: number;
};

export type PointData = {
  x: number; // offset from the tile center
  z: number; // offset from the tile center
  ringNumFromCenter: number; // 0 for the center
  corner?: CompassHexCorner;
  edge?: CompassHexEdge;
};

export type TerrainTileBuffers = {
  positions: number[];
  colors: number[];
  indices: number[];
};
