import { type GameKey } from "@/Common/Models/_GameModel";
import { Tile } from "@/Common/Models/Tile";
import type { TypeObject } from "@/Common/Static/Objects/TypeObject";
import { useDataBucket } from "@/Data/useDataBucket";
import { tileKey } from "@/Common/Helpers/mapTools";

export type CreateTileOptions = {
  x: number;
  y: number;
  domain?: TypeObject;
  area?: TypeObject;
  climate?: TypeObject;
  terrain?: TypeObject;
  elevation?: TypeObject;
  feature?: TypeObject | null;
  resource?: TypeObject | null;
  naturalWonder?: TypeObject | null;
  pollution?: TypeObject | null;
  route?: TypeObject | null;
  playerKey?: GameKey | null;
};

export function createTile(options: CreateTileOptions): Tile {
  const {
    x,
    y,
    playerKey = null,
    feature = null,
    resource = null,
    naturalWonder = null,
    pollution = null,
    route = null,
  } = options;

  const bucket = useDataBucket();
  const key = tileKey(x, y);
  const domain = options.domain ?? bucket.getType("domainType:land");
  const area = options.area ?? bucket.getType("continentType:europe");
  const climate = options.climate ?? bucket.getType("climateType:temperate");
  const terrain = options.terrain ?? bucket.getType("terrainType:grass");
  const elevation = options.elevation ?? bucket.getType("elevationType:flat");

  return new Tile(
    key,
    x,
    y,
    domain,
    area,
    climate,
    terrain,
    elevation,
    feature,
    resource,
    naturalWonder,
    pollution,
    route,
    playerKey,
  );
}
