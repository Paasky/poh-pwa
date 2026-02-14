import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CapabilityEmphasis } from "@/Actor/Ai/Emphasis/Calculators/CapabilityEmphasis";
import { UrgencyEmphasis } from "@/Actor/Ai/Emphasis/Calculators/UrgencyEmphasis";
import { GainEmphasis } from "@/Actor/Ai/Emphasis/Calculators/GainEmphasis";
import { DenyEmphasis } from "@/Actor/Ai/Emphasis/Calculators/DenyEmphasis";
import { RewardEmphasis } from "@/Actor/Ai/Emphasis/Calculators/RewardEmphasis";
import { RiskEmphasis } from "@/Actor/Ai/Emphasis/Calculators/RiskEmphasis";
import {
  createPlayer,
  createTile,
  createCity,
  createUnitDesign,
  createUnit,
  createCitizen,
  createConstruction,
  initTestDataBucket,
} from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { generateKey, type GameKey } from "@/Common/Models/_GameTypes";
import { tileKey } from "@/Common/Helpers/mapTools";
import { Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { Tile } from "@/Common/Models/Tile";

function setupPlayers(...keys: GameKey[]): void {
  const bucket = useDataBucket();
  const vikingType = bucket.getType("majorCultureType:viking");
  const clusters = keys.map((key) => createPlayer({ cultureType: vikingType, key }));
  bucket.setObjects(clusters.flatMap((c) => c.all));
}

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
    setupPlayers(playerKey1, playerKey2);

    const bucket = useDataBucket();
    bucket.setObjects([
      createTile({ x: 0, y: 0 }),
      createTile({ x: 0, y: 1 }),
      createTile({ x: 1, y: 0 }),
      createTile({ x: 1, y: 1 }),
      createCity({
        key: cityKey1,
        playerKey: playerKey1,
        tileKey: tileKey1,
        name: "City 1",
        health: 100,
        isCapital: true,
      }),
      createCity({
        key: cityKey2,
        playerKey: playerKey2,
        tileKey: tileKey2,
        name: "City 2",
        health: 50,
        isCapital: false,
        origPlayerKey: playerKey1,
      }),
    ]);

    player = bucket.getObject<Player>(playerKey1);
    locality.tiles.add(bucket.getObject<Tile>(tileKey1));
    locality.tiles.add(bucket.getObject<Tile>(tileKey2));
    locality.tiles.add(bucket.getObject<Tile>(tileKey3));
    locality.tiles.add(bucket.getObject<Tile>(tileKey4));
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
      setupPlayers(playerKey1, playerKey2);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({ x: 0, y: 0 }),
        createTile({ x: 0, y: 1 }),
        createUnitDesign({
          key: designKey1,
          playerKey: playerKey1,
          platform: bucket.getType("platformType:human"),
          equipment: bucket.getType("equipmentType:rifle"),
        }),
        createUnitDesign({
          key: designKey2,
          playerKey: playerKey2,
          platform: bucket.getType("platformType:human"),
          equipment: bucket.getType("equipmentType:rifle"),
        }),
        createUnit({
          key: unitKey1,
          playerKey: playerKey1,
          designKey: designKey1,
          tileKey: tileKey1,
        }),
        createUnit({
          key: unitKey2,
          playerKey: playerKey2,
          designKey: designKey2,
          tileKey: tileKey2,
        }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket.getObject<Tile>(tileKey1),
        bucket.getObject<Tile>(tileKey2),
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
      setupPlayers(playerKey1, playerKey2);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({ x: 0, y: 0 }),
        createTile({ x: 0, y: 1 }),
        createTile({ x: 1, y: 0 }),
        createUnitDesign({
          key: designKey1,
          playerKey: playerKey1,
          platform: bucket.getType("platformType:human"),
          equipment: bucket.getType("equipmentType:rifle"),
        }),
        createUnitDesign({
          key: designKey2,
          playerKey: playerKey2,
          platform: bucket.getType("platformType:human"),
          equipment: bucket.getType("equipmentType:rifle"),
        }),
        createUnit({
          key: unitKey1,
          playerKey: playerKey1,
          designKey: designKey1,
          tileKey: tileKey1,
        }),
        createUnit({
          key: unitKey2,
          playerKey: playerKey1,
          designKey: designKey1,
          tileKey: tileKey2,
        }),
        createUnit({
          key: unitKey3,
          playerKey: playerKey2,
          designKey: designKey2,
          tileKey: tileKey3,
        }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket.getObject<Tile>(tileKey1),
        bucket.getObject<Tile>(tileKey2),
        bucket.getObject<Tile>(tileKey3),
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
      const vikingType = useDataBucket().getType("majorCultureType:viking");
      const c1 = createPlayer({ cultureType: vikingType, key: playerKey1 });
      const c2 = createPlayer({ cultureType: vikingType, key: playerKey2 });
      const bucket = useDataBucket();
      bucket.setObjects([...c1.all, ...c2.all]);
      bucket.setObjects([
        createTile({ x: 0, y: 0 }),
        createTile({ x: 0, y: 1 }),
        createCity({ key: cityKey1, playerKey: playerKey1, tileKey: tileKey1 }),
        createCitizen({
          key: citizenKey1,
          playerKey: playerKey1,
          cultureKey: c1.culture.key,
          cityKey: cityKey1,
          tileKey: tileKey1,
        }),
        createCitizen({
          key: citizenKey2,
          playerKey: playerKey2,
          cultureKey: c2.culture.key,
          cityKey: cityKey1,
          tileKey: tileKey2,
        }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket.getObject<Tile>(tileKey1),
        bucket.getObject<Tile>(tileKey2),
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
      setupPlayers(playerKey1);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({ x: 0, y: 0 }),
        createCity({ key: cityKey1, playerKey: playerKey1, tileKey: tileKey1, health: 30 }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([bucket.getObject<Tile>(tileKey1)]);
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
      setupPlayers(playerKey1);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({ x: 0, y: 0 }),
        createCity({ key: cityKey1, playerKey: playerKey1, tileKey: tileKey1, health: 75 }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([bucket.getObject<Tile>(tileKey1)]);
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
      setupPlayers(playerKey1);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({
          x: 0,
          y: 0,
          playerKey: playerKey1,
          resource: bucket.getType("resourceType:iron"),
        }),
        createTile({
          x: 0,
          y: 1,
          playerKey: playerKey1,
          resource: bucket.getType("resourceType:copper"),
        }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket.getObject<Tile>(tileKey1),
        bucket.getObject<Tile>(tileKey2),
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
      setupPlayers(playerKey1);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({
          x: 0,
          y: 0,
          playerKey: playerKey1,
          domain: bucket.getType("domainType:land"),
        }),
        createTile({
          x: 0,
          y: 1,
          playerKey: playerKey1,
          domain: bucket.getType("domainType:land"),
        }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket.getObject<Tile>(tileKey1),
        bucket.getObject<Tile>(tileKey2),
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
      setupPlayers(playerKey1);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({
          x: 0,
          y: 0,
          playerKey: playerKey1,
          domain: bucket.getType("domainType:land"),
        }),
        createTile({
          x: 0,
          y: 1,
          playerKey: playerKey1,
          domain: bucket.getType("domainType:land"),
        }),
        createConstruction({ key: constructionKey1, tileKey: tileKey1 }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket.getObject<Tile>(tileKey1),
        bucket.getObject<Tile>(tileKey2),
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
      setupPlayers(playerKey1, playerKey2);

      const bucket = useDataBucket();
      bucket.setObjects([
        createTile({
          x: 0,
          y: 0,
          playerKey: playerKey2,
          resource: bucket.getType("resourceType:iron"),
        }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([bucket.getObject<Tile>(tileKey1)]);

      const calculator = new DenyEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("deny");
      expect(result.reasons.some((r) => r.type === "enemyValueTile")).toBe(true);
      const valueReason = result.reasons.find((r) => r.type === "enemyValueTile");
      expect(valueReason?.value).toBe(20);
    });

    it("should calculate max value (100) for many enemy value tiles", async () => {
      await initTestDataBucket();
      setupPlayers(playerKey1, playerKey2);

      const bucket = useDataBucket();
      const tileKey5 = tileKey(2, 0);
      bucket.setObjects([
        createTile({
          x: 0,
          y: 0,
          playerKey: playerKey2,
          resource: bucket.getType("resourceType:iron"),
        }),
        createTile({
          x: 0,
          y: 1,
          playerKey: playerKey2,
          resource: bucket.getType("resourceType:copper"),
        }),
        createTile({
          x: 1,
          y: 0,
          playerKey: playerKey2,
          resource: bucket.getType("resourceType:gold"),
        }),
        createTile({
          x: 1,
          y: 1,
          playerKey: playerKey2,
          resource: bucket.getType("resourceType:silver"),
        }),
        createTile({
          x: 2,
          y: 0,
          playerKey: playerKey2,
          resource: bucket.getType("resourceType:wheat"),
        }),
      ]);

      player = bucket.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket.getObject<Tile>(tileKey1),
        bucket.getObject<Tile>(tileKey2),
        bucket.getObject<Tile>(tileKey3),
        bucket.getObject<Tile>(tileKey4),
        bucket.getObject<Tile>(tileKey5),
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
      const cluster1a = createPlayer({
        cultureType: useDataBucket().getType("majorCultureType:viking"),
        key: playerKey1,
      });
      cluster1a.player.knownTileKeys = new Set([tileKey1, tileKey2, tileKey3]);
      const bucket1a = useDataBucket();
      bucket1a.setObjects(cluster1a.all);
      bucket1a.setObjects([
        createTile({ x: 0, y: 0 }),
        createTile({ x: 0, y: 1 }),
        createTile({ x: 1, y: 0 }),
      ]);

      player = bucket1a.getObject<Player>(playerKey1);
      locality.tiles = new Set([
        bucket1a.getObject<Tile>(tileKey1),
        bucket1a.getObject<Tile>(tileKey2),
        bucket1a.getObject<Tile>(tileKey3),
      ]);

      const calculator = new RewardEmphasis(player, locality);
      const result = calculator.calculate();

      expect(result.category).toBe("reward");
      expect(result.value).toBe(0);
    });

    it("should calculate mid value when some tiles unknown", async () => {
      await initTestDataBucket();
      const cluster1b = createPlayer({
        cultureType: useDataBucket().getType("majorCultureType:viking"),
        key: playerKey1,
      });
      cluster1b.player.knownTileKeys = new Set([tileKey1]);
      useDataBucket().setObjects(cluster1b.all);
      useDataBucket().setObjects([
        createTile({ x: 0, y: 0 }),
        createTile({ x: 0, y: 1 }),
        createTile({ x: 1, y: 0 }),
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
      const cluster1c = createPlayer({
        cultureType: useDataBucket().getType("majorCultureType:viking"),
        key: playerKey1,
      });
      useDataBucket().setObjects(cluster1c.all);
      useDataBucket().setObjects([createTile({ x: 0, y: 0 }), createTile({ x: 0, y: 1 })]);

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
      setupPlayers(playerKey1, playerKey2);
      const bucket658 = useDataBucket();
      bucket658.setObjects([
        createTile({ x: 0, y: 0 }),
        createUnitDesign({
          key: designKey1,
          playerKey: playerKey2,
          platform: bucket658.getType("platformType:human"),
          equipment: bucket658.getType("equipmentType:rifle"),
        }),
        createUnit({
          key: unitKey1,
          playerKey: playerKey2,
          designKey: designKey1,
          tileKey: tileKey1,
        }),
      ]);

      player = bucket658.getObject<Player>(playerKey1);
      locality.tiles = new Set([bucket658.getObject<Tile>(tileKey1)]);
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
      setupPlayers(playerKey1);
      const bucket691 = useDataBucket();
      bucket691.setObjects([
        createTile({
          x: 0,
          y: 0,
          playerKey: playerKey1,
          resource: bucket691.getType("resourceType:iron"),
        }),
      ]);

      player = bucket691.getObject<Player>(playerKey1);
      locality.tiles = new Set([bucket691.getObject<Tile>(tileKey1)]);
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
      setupPlayers(playerKey1, playerKey2);
      const bucket721 = useDataBucket();
      bucket721.setObjects([
        createTile({
          x: 0,
          y: 0,
          playerKey: playerKey1,
          resource: bucket721.getType("resourceType:iron"),
        }),
        createTile({ x: 0, y: 1 }),
        createUnitDesign({
          key: designKey1,
          playerKey: playerKey2,
          platform: bucket721.getType("platformType:human"),
          equipment: bucket721.getType("equipmentType:rifle"),
        }),
        createUnit({
          key: unitKey1,
          playerKey: playerKey2,
          designKey: designKey1,
          tileKey: tileKey2,
        }),
        createUnit({
          key: unitKey2,
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
