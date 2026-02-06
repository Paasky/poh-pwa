import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CapabilityEmphasis } from "@/Actor/Ai/Emphasis/Calculators/CapabilityEmphasis";
import { UrgencyEmphasis } from "@/Actor/Ai/Emphasis/Calculators/UrgencyEmphasis";
import { GainEmphasis } from "@/Actor/Ai/Emphasis/Calculators/GainEmphasis";
import { DenyEmphasis } from "@/Actor/Ai/Emphasis/Calculators/DenyEmphasis";
import { RewardEmphasis } from "@/Actor/Ai/Emphasis/Calculators/RewardEmphasis";
import { RiskEmphasis } from "@/Actor/Ai/Emphasis/Calculators/RiskEmphasis";
import {
  citizenRawData,
  cityRawData,
  constructionRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
  unitDesignRawData,
  unitRawData,
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
      ...tileRawData(tileKey3),
      ...tileRawData(tileKey4),
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

    it("should calculate mid value (50) when military evenly matched", async () => {
      const designKey1 = generateKey("unitDesign");
      const designKey2 = generateKey("unitDesign");
      const unitKey1 = generateKey("unit");
      const unitKey2 = generateKey("unit");

      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...playerRawData(playerKey2),
        ...tileRawData(tileKey1),
        ...tileRawData(tileKey2),
        ...unitDesignRawData(designKey1, {
          playerKey: playerKey1,
          platform: "platformType:human",
          equipment: "equipmentType:rifle",
        }),
        ...unitDesignRawData(designKey2, {
          playerKey: playerKey2,
          platform: "platformType:human",
          equipment: "equipmentType:rifle",
        }),
        ...unitRawData(unitKey1, {
          playerKey: playerKey1,
          designKey: designKey1,
          tileKey: tileKey1,
        }),
        ...unitRawData(unitKey2, {
          playerKey: playerKey2,
          designKey: designKey2,
          tileKey: tileKey2,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
      ]);

      const calculator = new CapabilityEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("capability");
      expect(result.value).toBe(50);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0].type).toBe("ourMilitary");
      expect(result.reasons[0].value).toBe(50);
    });

    it("should calculate max value (100) when military dominant (2:1 ratio)", async () => {
      const designKey1 = generateKey("unitDesign");
      const designKey2 = generateKey("unitDesign");
      const unitKey1 = generateKey("unit");
      const unitKey2 = generateKey("unit");
      const unitKey3 = generateKey("unit");

      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...playerRawData(playerKey2),
        ...tileRawData(tileKey1),
        ...tileRawData(tileKey2),
        ...tileRawData(tileKey3),
        ...unitDesignRawData(designKey1, {
          playerKey: playerKey1,
          platform: "platformType:human",
          equipment: "equipmentType:rifle",
        }),
        ...unitDesignRawData(designKey2, {
          playerKey: playerKey2,
          platform: "platformType:human",
          equipment: "equipmentType:rifle",
        }),
        ...unitRawData(unitKey1, {
          playerKey: playerKey1,
          designKey: designKey1,
          tileKey: tileKey1,
        }),
        ...unitRawData(unitKey2, {
          playerKey: playerKey1,
          designKey: designKey1,
          tileKey: tileKey2,
        }),
        ...unitRawData(unitKey3, {
          playerKey: playerKey2,
          designKey: designKey2,
          tileKey: tileKey3,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
        useDataBucket().getObject<Tile>(tileKey3),
      ]);

      const calculator = new CapabilityEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("capability");
      expect(result.value).toBe(100);
      expect(result.reasons[0].value).toBe(100);
    });

    it("should calculate culture capability when evenly matched", async () => {
      const citizenKey1 = generateKey("citizen");
      const citizenKey2 = generateKey("citizen");

      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...playerRawData(playerKey2),
        ...tileRawData(tileKey1),
        ...tileRawData(tileKey2),
        ...cityRawData(cityKey1, { playerKey: playerKey1, tileKey: tileKey1 }),
        ...citizenRawData(citizenKey1, {
          playerKey: playerKey1,
          cultureKey: "culture:1",
          cityKey: cityKey1,
          tileKey: tileKey1,
        }),
        ...citizenRawData(citizenKey2, {
          playerKey: playerKey2,
          cultureKey: "culture:2",
          cityKey: cityKey1,
          tileKey: tileKey2,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
      ]);

      const calculator = new CapabilityEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("capability");
      expect(result.reasons.some((r) => r.type === "ourCulture")).toBe(true);
      const cultureReason = result.reasons.find((r) => r.type === "ourCulture");
      expect(cultureReason?.value).toBe(50);
    });
  });

  describe("UrgencyEmphasis", () => {
    it("should calculate min value (0) when tension is safe", () => {
      locality.tension = "safe";

      const calculator = new UrgencyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("urgency");
      expect(result.value).toBe(0);
    });

    it("should calculate mid value (50) when tension is suspicious", () => {
      locality.tension = "suspicious";

      const calculator = new UrgencyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("urgency");
      expect(result.value).toBe(50);
      expect(result.reasons[0].type).toBe("tension");
      expect(result.reasons[0].value).toBe(50);
    });

    it("should calculate max value (100) when tension is violence", () => {
      locality.tension = "violence";

      const calculator = new UrgencyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("urgency");
      expect(result.value).toBe(100);
      expect(result.reasons[0].value).toBe(100);
    });

    it("should calculate siege urgency when city health is low", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...tileRawData(tileKey1),
        ...cityRawData(cityKey1, {
          playerKey: playerKey1,
          tileKey: tileKey1,
          health: 30,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([useDataBucket().getObject<Tile>(tileKey1)]);
      locality.tension = "safe";

      const calculator = new UrgencyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("urgency");
      expect(result.reasons.some((r) => r.type === "siege")).toBe(true);
      const siegeReason = result.reasons.find((r) => r.type === "siege");
      expect(siegeReason?.value).toBe(100);
    });

    it("should calculate siege urgency when city health is at 75", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...tileRawData(tileKey1),
        ...cityRawData(cityKey1, {
          playerKey: playerKey1,
          tileKey: tileKey1,
          health: 75,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([useDataBucket().getObject<Tile>(tileKey1)]);
      locality.tension = "safe";

      const calculator = new UrgencyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("urgency");
      expect(result.reasons.some((r) => r.type === "siege")).toBe(true);
      const siegeReason = result.reasons.find((r) => r.type === "siege");
      expect(siegeReason?.value).toBe(50);
    });
  });

  describe("GainEmphasis", () => {
    it("should calculate min value (0) when no gain opportunities", () => {
      const calculator = new GainEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("gain");
      expect(result.value).toBe(0);
    });

    it("should calculate value for unused resources", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...tileRawData(tileKey1, {
          playerKey: playerKey1,
          resource: "resourceType:iron",
        }),
        ...tileRawData(tileKey2, {
          playerKey: playerKey1,
          resource: "resourceType:copper",
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
      ]);

      const calculator = new GainEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("gain");
      expect(result.reasons.some((r) => r.type === "unusedResource")).toBe(true);
      const resourceReason = result.reasons.find((r) => r.type === "unusedResource");
      expect(resourceReason?.value).toBe(50);
    });

    it("should calculate value for unimproved land", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...tileRawData(tileKey1, {
          playerKey: playerKey1,
          domain: "domainType:land",
        }),
        ...tileRawData(tileKey2, {
          playerKey: playerKey1,
          domain: "domainType:land",
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
      ]);

      const calculator = new GainEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("gain");
      expect(result.reasons.some((r) => r.type === "unimprovedLand")).toBe(true);
      const landReason = result.reasons.find((r) => r.type === "unimprovedLand");
      expect(landReason?.value).toBe(100);
    });

    it("should not count improved land as unimproved", async () => {
      const constructionKey1 = generateKey("construction");

      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...tileRawData(tileKey1, {
          playerKey: playerKey1,
          domain: "domainType:land",
        }),
        ...tileRawData(tileKey2, {
          playerKey: playerKey1,
          domain: "domainType:land",
        }),
        ...constructionRawData(constructionKey1, {
          tileKey: tileKey1,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
      ]);

      const calculator = new GainEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("gain");
      expect(result.reasons.some((r) => r.type === "unimprovedLand")).toBe(true);
      const landReason = result.reasons.find((r) => r.type === "unimprovedLand");
      expect(landReason?.value).toBe(50);
    });
  });

  describe("DenyEmphasis", () => {
    it("should calculate min value (0) when no enemy presence", () => {
      const calculator = new DenyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("deny");
      expect(result.value).toBe(0);
    });

    it("should calculate value for enemy value tiles", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...playerRawData(playerKey2),
        ...tileRawData(tileKey1, {
          playerKey: playerKey2,
          resource: "resourceType:iron",
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([useDataBucket().getObject<Tile>(tileKey1)]);

      const calculator = new DenyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("deny");
      expect(result.reasons.some((r) => r.type === "enemyValueTile")).toBe(true);
      const valueReason = result.reasons.find((r) => r.type === "enemyValueTile");
      expect(valueReason?.value).toBe(20);
    });

    it("should calculate max value (100) for many enemy value tiles", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...playerRawData(playerKey2),
        ...tileRawData(tileKey1, {
          playerKey: playerKey2,
          resource: "resourceType:iron",
        }),
        ...tileRawData(tileKey2, {
          playerKey: playerKey2,
          resource: "resourceType:copper",
        }),
        ...tileRawData(tileKey3, {
          playerKey: playerKey2,
          resource: "resourceType:gold",
        }),
        ...tileRawData(tileKey4, {
          playerKey: playerKey2,
          resource: "resourceType:silver",
        }),
        ...tileRawData(tileKey(2, 0), {
          playerKey: playerKey2,
          resource: "resourceType:wheat",
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
        useDataBucket().getObject<Tile>(tileKey3),
        useDataBucket().getObject<Tile>(tileKey4),
        useDataBucket().getObject<Tile>(tileKey(2, 0)),
      ]);

      const calculator = new DenyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("deny");
      expect(result.value).toBe(100);
    });
  });

  describe("RewardEmphasis", () => {
    it("should calculate min value (0) when all tiles known", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1, {
          knownTileKeys: new Set([tileKey1, tileKey2, tileKey3]),
        }),
        ...tileRawData(tileKey1),
        ...tileRawData(tileKey2),
        ...tileRawData(tileKey3),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
        useDataBucket().getObject<Tile>(tileKey3),
      ]);

      const calculator = new RewardEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("reward");
      expect(result.value).toBe(0);
    });

    it("should calculate mid value when some tiles unknown", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1, {
          knownTileKeys: new Set([tileKey1]),
        }),
        ...tileRawData(tileKey1),
        ...tileRawData(tileKey2),
        ...tileRawData(tileKey3),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
        useDataBucket().getObject<Tile>(tileKey3),
      ]);

      const calculator = new RewardEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("reward");
      expect(result.value).toBe(67);
      expect(result.reasons[0].type).toBe("unknownTile");
    });

    it("should calculate max value (100) when all tiles unknown", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1, {
          knownTileKeys: new Set(),
        }),
        ...tileRawData(tileKey1),
        ...tileRawData(tileKey2),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
      ]);

      const calculator = new RewardEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("reward");
      expect(result.value).toBe(100);
    });
  });

  describe("RiskEmphasis", () => {
    it("should calculate min value (0) when no risks present", () => {
      locality.tension = "safe";

      const calculator = new RiskEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("risk");
      expect(result.value).toBe(0);
    });

    it("should calculate value for enemy military presence", async () => {
      const designKey1 = generateKey("unitDesign");
      const unitKey1 = generateKey("unit");

      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...playerRawData(playerKey2),
        ...tileRawData(tileKey1),
        ...unitDesignRawData(designKey1, {
          playerKey: playerKey2,
          platform: "platformType:human",
          equipment: "equipmentType:rifle",
        }),
        ...unitRawData(unitKey1, {
          playerKey: playerKey2,
          designKey: designKey1,
          tileKey: tileKey1,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([useDataBucket().getObject<Tile>(tileKey1)]);
      locality.tension = "safe";

      const calculator = new RiskEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("risk");
      expect(result.reasons.some((r) => r.type === "enemyMilitary")).toBe(true);
      const militaryReason = result.reasons.find((r) => r.type === "enemyMilitary");
      expect(militaryReason?.value).toBe(15);
    });

    it("should calculate value for our value tiles at risk", async () => {
      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...tileRawData(tileKey1, {
          playerKey: playerKey1,
          resource: "resourceType:iron",
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([useDataBucket().getObject<Tile>(tileKey1)]);
      locality.tension = "safe";

      const calculator = new RiskEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("risk");
      expect(result.reasons.some((r) => r.type === "ourValueTile")).toBe(true);
      const valueReason = result.reasons.find((r) => r.type === "ourValueTile");
      expect(valueReason?.value).toBe(15);
    });

    it("should combine multiple risk factors", async () => {
      const designKey1 = generateKey("unitDesign");
      const unitKey1 = generateKey("unit");
      const unitKey2 = generateKey("unit");

      await initTestDataBucket();
      useDataBucket().setRawObjects([
        ...playerRawData(playerKey1),
        ...playerRawData(playerKey2),
        ...tileRawData(tileKey1, {
          playerKey: playerKey1,
          resource: "resourceType:iron",
        }),
        ...tileRawData(tileKey2),
        ...unitDesignRawData(designKey1, {
          playerKey: playerKey2,
          platform: "platformType:human",
          equipment: "equipmentType:rifle",
        }),
        ...unitRawData(unitKey1, {
          playerKey: playerKey2,
          designKey: designKey1,
          tileKey: tileKey2,
        }),
        ...unitRawData(unitKey2, {
          playerKey: playerKey2,
          designKey: designKey1,
          tileKey: tileKey2,
        }),
      ]);

      player = useDataBucket().getObject<Player>(playerKey1);
      locality.tiles = new Set([
        useDataBucket().getObject<Tile>(tileKey1),
        useDataBucket().getObject<Tile>(tileKey2),
      ]);
      locality.tension = "suspicious";

      const calculator = new RiskEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("risk");
      expect(result.reasons.length).toBe(3);
      expect(result.reasons.some((r) => r.type === "enemyMilitary")).toBe(true);
      expect(result.reasons.some((r) => r.type === "ourValueTile")).toBe(true);
      expect(result.reasons.some((r) => r.type === "tension")).toBe(true);
      expect(result.value).toBeGreaterThan(20);
    });
  });
});
