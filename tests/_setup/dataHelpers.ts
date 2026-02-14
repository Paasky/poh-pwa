import { IRawGameObject } from "@/Common/Models/_GameTypes";
import { WorldState } from "@/Common/Objects/World";
import { setDataBucket } from "@/Data/useDataBucket";
import { DataBucket } from "@/Data/DataBucket";
import { TestWorldState } from "./testWorld";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { CompiledStaticData } from "@/Data/StaticDataCompiler";

export { createPlayer } from "@/Common/factories/models/player";
export { createTile } from "@/Common/factories/models/tile";
export { createCity } from "@/Common/factories/models/city";
export { createUnitDesign } from "@/Common/factories/models/unitDesign";
export { createUnit } from "@/Common/factories/models/unit";
export { createCitizen } from "@/Common/factories/models/citizen";
export { createConstruction } from "@/Common/factories/models/construction";

/**************************
 * Test Data Bucket Setup *
 **************************/

let rawDataCache: CompiledStaticData | null = null;

export async function initTestDataBucket(
  gameData?: IRawGameObject[],
  world?: WorldState,
): Promise<DataBucket> {
  return setDataBucket(DataBucket.fromRaw(getRawStaticData(), world ?? TestWorldState, gameData));
}

export function getRawStaticData(): CompiledStaticData {
  if (rawDataCache) return rawDataCache;

  const filePath = path.join(process.cwd(), "public", "data", "staticData.json");

  if (!fs.existsSync(filePath)) {
    execSync("pnpm data:bake", { stdio: "inherit" });

    if (!fs.existsSync(filePath)) {
      throw new Error(`staticData.json still missing after pnpm data:bake at ${filePath}`);
    }
  }

  rawDataCache = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return rawDataCache!;
}
