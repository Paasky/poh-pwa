import { generateKey, type GameKey } from "@/Common/Models/_GameModel";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import type { TypeObject } from "@/Common/Static/Objects/TypeObject";
import { useDataBucket } from "@/Data/useDataBucket";

export type CreateUnitDesignOptions = {
  key?: GameKey;
  platform?: TypeObject;
  equipment?: TypeObject;
  name?: string;
  playerKey?: GameKey | null;
  isElite?: boolean;
  isActive?: boolean;
};

export function createUnitDesign(options: CreateUnitDesignOptions = {}): UnitDesign {
  const { name = "Test Unit Design", playerKey = null, isElite = false, isActive = true } = options;

  const bucket = useDataBucket();
  const key = options.key ?? generateKey("unitDesign");
  const platform = options.platform ?? bucket.getType("platformType:raft");
  const equipment = options.equipment ?? bucket.getType("equipmentType:axe");

  return new UnitDesign(key, platform, equipment, name, playerKey, isElite, isActive);
}
