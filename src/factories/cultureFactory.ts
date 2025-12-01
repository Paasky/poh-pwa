import { ObjKey } from "@/types/common";
import { TypeObject } from "@/types/typeObjects";
import {
  Culture,
  CultureStatus,
  GameKey,
  generateKey,
} from "@/objects/game/gameObjects";

export const createCulture = (
  playerKey: GameKey,
  type: TypeObject,
  status: CultureStatus = "notSettled",
  heritages: TypeObject[] = [],
  heritageCategoryPoints: Record<ObjKey, number> = {},
  traits: TypeObject[] = [],
): Culture => {
  const culture = new Culture(generateKey("culture"), type, playerKey);

  culture.status.value = status;
  culture.heritages.value = heritages;
  culture.heritageCategoryPoints.value = heritageCategoryPoints;
  culture.traits.value = traits;

  return culture;
};
