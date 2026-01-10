import { afterEach, beforeEach, describe, it } from "vitest";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
  tradeRouteRawData,
  unitDesignRawData,
  unitRawData,
} from "../../../_setup/dataHelpers";
import { tileKey } from "@/Common/Helpers/mapTools";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { TradeRoute } from "@/Common/Models/TradeRoute";
import { GameKey, generateKey } from "@/Common/Models/_GameTypes";
import {
  expectRelationToThrowMissing,
  testManyToManyRelation,
  testManyToOneRelation,
  testOneToOneRelation,
} from "../../../_setup/testHelpers";
import { Tile } from "@/Common/Models/Tile";
import { City } from "@/Common/Models/City";
import { Unit } from "@/Common/Models/Unit";

describe("TradeRoute", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const tradeRouteKey1 = generateKey("tradeRoute");
    const tradeRouteKey2 = generateKey("tradeRoute");
    const city1Key = "city:1";
    const city2Key = "city:2";
    const city3Key = "city:3";
    const unit1Key = "unit:1";
    const unit2Key = "unit:2";
    const tileKey1 = tileKey(0, 0);
    const tileKey2 = tileKey(1, 1);
    const playerKey = "player:1";
    const designKey = "unitDesign:1";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey, { cultureKey: "culture:1" }),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...cityRawData(city1Key, { playerKey, tileKey: tileKey1 }),
      ...cityRawData(city2Key, { playerKey, tileKey: tileKey1 }),
      ...cityRawData(city3Key, { playerKey, tileKey: tileKey2 }),
      ...unitDesignRawData(designKey, { playerKey }),
      ...unitRawData(unit1Key, { designKey, playerKey, tileKey: tileKey1 }),
      ...unitRawData(unit2Key, { designKey, playerKey, tileKey: tileKey2 }),
      ...tradeRouteRawData(tradeRouteKey1, {
        city1Key,
        city2Key,
        unitKey: unit1Key,
        tileKeys: [tileKey1],
      }),
      ...tradeRouteRawData(tradeRouteKey2, {
        city1Key,
        city2Key: city3Key,
        unitKey: unit2Key,
        tileKeys: [tileKey1, tileKey2],
      }),
    ]);

    const tradeRoute1 = useDataBucket().getObject<TradeRoute>(tradeRouteKey1);
    const tradeRoute2 = useDataBucket().getObject<TradeRoute>(tradeRouteKey2);

    testManyToOneRelation(
      tradeRoute1,
      "city1",
      useDataBucket().getObject<City>(city1Key),
      "tradeRoutes",
    );
    testManyToOneRelation(
      tradeRoute1,
      "city2",
      useDataBucket().getObject<City>(city2Key),
      "tradeRoutes",
    );
    testOneToOneRelation(
      tradeRoute1,
      "unit",
      useDataBucket().getObject<Unit>(unit1Key),
      "tradeRoute",
    );
    testManyToManyRelation(
      tradeRoute1,
      "tiles",
      useDataBucket().getObject<Tile>(tileKey1),
      "tradeRoutes",
    );

    testManyToOneRelation(
      tradeRoute2,
      "city1",
      useDataBucket().getObject<City>(city1Key),
      "tradeRoutes",
    );
    testManyToOneRelation(
      tradeRoute2,
      "city2",
      useDataBucket().getObject<City>(city3Key),
      "tradeRoutes",
    );
    testOneToOneRelation(
      tradeRoute2,
      "unit",
      useDataBucket().getObject<Unit>(unit2Key),
      "tradeRoute",
    );
    testManyToManyRelation(
      tradeRoute2,
      "tiles",
      useDataBucket().getObject<Tile>(tileKey1),
      "tradeRoutes",
    );
    testManyToManyRelation(
      tradeRoute2,
      "tiles",
      useDataBucket().getObject<Tile>(tileKey2),
      "tradeRoutes",
    );
  });

  it("throws correct message for invalid relations", () => {
    const tradeRouteKey = generateKey("tradeRoute");

    // City 1 missing
    const tradeRouteCity1Missing = new TradeRoute(
      tradeRouteKey,
      "city:99",
      "city:2",
      new Set<GameKey>(["tile:1"]),
      "unit:1",
    );
    useDataBucket().setObject(tradeRouteCity1Missing);
    expectRelationToThrowMissing(tradeRouteCity1Missing, "city1", "city:99");

    // City 2 missing
    const tradeRouteCity2Missing = new TradeRoute(
      tradeRouteKey,
      "city:1",
      "city:99",
      new Set<GameKey>(["tile:1"]),
      "unit:1",
    );
    useDataBucket().setObject(tradeRouteCity2Missing);
    expectRelationToThrowMissing(tradeRouteCity2Missing, "city2", "city:99");

    // Unit missing
    const tradeRouteUnitMissing = new TradeRoute(
      tradeRouteKey,
      "city:1",
      "city:2",
      new Set<GameKey>(["tile:1"]),
      "unit:99",
    );
    useDataBucket().setObject(tradeRouteUnitMissing);
    expectRelationToThrowMissing(tradeRouteUnitMissing, "unit", "unit:99");

    // Tile missing in tileKeys
    const tradeRouteTileMissing = new TradeRoute(
      tradeRouteKey,
      "city:1",
      "city:2",
      new Set<GameKey>(["tile:99"]),
      "unit:1",
    );
    useDataBucket().setObject(tradeRouteTileMissing);
    expectRelationToThrowMissing(tradeRouteTileMissing, "tiles", "tile:99");
  });

  // todo: Test route deletion and yields.
});
