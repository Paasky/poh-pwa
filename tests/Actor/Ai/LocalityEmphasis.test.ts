import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CapabilityEmphasis } from "@/Actor/Ai/Emphasis/Calculators/CapabilityEmphasis";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
} from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { generateKey } from "@/Common/Models/_GameTypes";
import { tileKey } from "@/Common/Helpers/mapTools";
import { Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { Tile } from "@/Common/Models/Tile";

describe("LocalityEmphasis Calculators", () => {
  let player = {} as Player;
  let locality = {
    id: crypto.randomUUID(),
    name: "Test Locality",
    neighbors: [],
    tiles: new Set<Tile>(),
  } as Locality;

  const cityKey1 = generateKey("city");
  const cityKey2 = generateKey("city");
  const playerKey1 = "player:1";
  const playerKey2 = "player:2";
  const tileKey1 = tileKey(0, 0);
  const tileKey2 = tileKey(0, 1);
  const tileKey3 = tileKey(1, 0);
  const tileKey4 = tileKey(1, 1);

  beforeEach(async () => {
    await initTestDataBucket();

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey1),
      ...playerRawData(playerKey2),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...cityRawData(cityKey1, {
        playerKey: playerKey1,
        tileKey: tileKey1,
        name: "City 1",
        health: 100,
        isCapital: true,
      }),
      ...cityRawData(cityKey2, {
        playerKey: playerKey2,
        tileKey: tileKey2,
        name: "City 2",
        health: 50,
        isCapital: false,
        origPlayerKey: "player:1",
      }),
    ]);

    player = useDataBucket().getObject<Player>(playerKey1);
    locality.tiles.add(useDataBucket().getObject<Tile>(tileKey1));
    locality.tiles.add(useDataBucket().getObject<Tile>(tileKey2));
    locality.tiles.add(useDataBucket().getObject<Tile>(tileKey3));
    locality.tiles.add(useDataBucket().getObject<Tile>(tileKey4));
  });

  afterEach(() => {
    destroyDataBucket();
  });

  describe("CapabilityEmphasis", () => {
    it("should calculate min value (0) when no capabilities present", () => {
      const calculator = new CapabilityEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("capability");
      expect(result.value).toBe(0);
      expect(result.reasons.length).toBe(0);
    });
  });
});
