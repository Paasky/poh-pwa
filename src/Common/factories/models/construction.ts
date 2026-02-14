import { generateKey, type GameKey } from "@/Common/Models/_GameModel";
import { Construction } from "@/Common/Models/Construction";
import type { TypeObject } from "@/Common/Static/Objects/TypeObject";
import { useDataBucket } from "@/Data/useDataBucket";

export type CreateConstructionOptions = {
  key?: GameKey;
  type?: TypeObject;
  tileKey: GameKey;
  cityKey?: GameKey | null;
  health?: number;
  progress?: number;
};

export function createConstruction(options: CreateConstructionOptions): Construction {
  const { tileKey, cityKey = null, health = 100, progress = 0 } = options;

  const bucket = useDataBucket();
  const key = options.key ?? generateKey("construction");
  const type = options.type ?? bucket.getType("buildingType:granary");

  return new Construction(key, type, tileKey, cityKey, health, progress);
}
