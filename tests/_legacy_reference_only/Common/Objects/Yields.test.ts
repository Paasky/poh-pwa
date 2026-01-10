import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initTestDataBucket } from "../../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { Yield, Yields } from "@/Common/Static/Yields";

describe("Yields", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });
  /* static types to use

    {
      "key": "buildingType:potter",
      "name": "Potter",
      "concept": "conceptType:building",
      "description": "A potter’s workshop produces ceramic vessels for cooking, storage, and exchange. Early Neolithic centers such as Çatalhöyük used coiling and open firing. Jomon communities in Japan created cord-marked wares over millennia. The potter’s wheel, adopted in ancient Mesopotamia, increased speed and uniformity by the late 4th millennium BCE. Materials included local clays, tempers, and slips; firing ranged from bonfires to updraft kilns. Forms served domestic and commercial needs, from storage jars to transport amphorae. Decorative styles signaled community traditions and trade contacts, as with Yangshao painted wares or Lapita dentate-stamped pottery across the Pacific. Workshops ranged from household production to specialized urban quarters supplying regional markets.",
      "category": "buildingCategory:growth",
      "yields": [
        {
          "type": "yieldType:productionCost",
          "amount": 30
        },
        {
          "type": "yieldType:citizenSlot",
          "amount": 1,
          "for": ["conceptType:building"]
        }
      ],
    {
      "key": "buildingType:garrison",
      "name": "Garrison",
      "concept": "conceptType:building",
      "description": "A garrison is a permanent detachment assigned to defend settlements, roads, and frontiers. It maintains watch, repairs defenses, and enforces authority. The Roman Empire stationed cohorts in castra along borders, as at Vindolanda on Hadrian’s Wall. Han China filled beacon towers and frontier towns with mixed infantry and cavalry to deter raids. In the Islamic world, ribats and citadels housed soldiers securing trade routes. Medieval polities placed garrisons in castles to control countryside. Renaissance states kept small infantry posts in conquered towns. Early modern powers exported the model overseas in presidios from the Philippines to New Spain. Garrison life shaped local economies through supply contracts and pay, and it stabilized rule by providing rapid response forces and a visible military presence.",
      "category": "buildingCategory:milLand",
      "yields": [
        {
          "type": "yieldType:productionCost",
          "amount": 160
        },
        {
          "type": "yieldType:production",
          "amount": 8,
          "for": ["platformType:human"]
        }
      ],
    {
      "key": "buildingType:wharf",
      "name": "Wharf",
      "concept": "conceptType:building",
      "description": "A wharf is a fixed platform along or projecting from a shore for berthing, loading, and unloading vessels. Early constructions used timber piles, rubble infill, and stone revetments. Phoenician cities such as Tyre and Sidon built complex quay works, as did the Greek port of Piraeus. The Indus site of Lothal had a basin and embankments functioning as a wharf in the third millennium BCE. Roman ports, including Ostia and Caesarea, combined masonry quays with cranes and warehouses. River trade depended on wharves along the Nile and China’s Grand Canal. Medieval towns added fish markets, customs posts, and crane towers beside their quays. Later works incorporated hydraulic concrete and iron ties. The wharf remained a core element of maritime commerce until container terminals reshaped waterfront layouts in the twentieth century.",
      "category": "buildingCategory:water",
      "yields": [
        {
          "type": "yieldType:productionCost",
          "amount": 30
        },
        {
          "type": "yieldType:food",
          "amount": 1,
          "for": ["improvementCategory:boats"]
        }
      ],
    {
      "key": "equipmentType:axe",
      "name": "Axe",
      "concept": "conceptType:equipment",
      "description": "The axe is one of the earliest composite tools and weapons. Neolithic makers shaped and polished stone heads and fixed them to wooden hafts to increase leverage and control. Stone axes cleared forests, built dwellings, and served in hunting and war. By the late fourth to third millennium BCE, metalworking introduced copper and then bronze blades with more durable edges. In ancient Mesopotamia, Sumerian and Akkadian troops carried battle-axes suited to breaking shields. Egyptian infantry used axes alongside spears in the Old and Middle Kingdoms. Forms diversified for carpentry, felling, and combat. The axe persisted as a military sidearm even after swords spread, and remained vital in daily labor long after dedicated war axes declined.",
      "category": "equipmentCategory:melee",
      "yields": [
        {
          "type": "yieldType:productionCost",
          "amount": 10
        },
        {
          "type": "yieldType:productionCost",
          "amount": 15,
          "method": "percent"
        },
        {
          "type": "yieldType:strength",
          "amount": 6
        },
        {
          "type": "yieldType:strength",
          "amount": 30,
          "method": "percent",
          "vs": ["platformType:human"]
        }
      ],
    {
      "key": "equipmentType:spear",
      "name": "Spear",
      "concept": "conceptType:equipment",
      "description": "The spear is the earliest purpose-made weapon of human warfare. It began as a fire-hardened wooden thrusting pole used in hunting. Stone or bone tips were later hafted to increase penetration. In the early cities of Mesopotamia and the Nile, levy infantry carried simple spears with hide or wicker shields. Such weapons demanded minimal training and allowed close-order ranks to keep predators and foes at distance. Spearheads were often socketless and bound with sinew or pitch. The weapon worked both for thrusting at short reach and for defensive bracing. Hunter-gatherer groups, Sumerian levies, and Egyptian militias fielded variants suited to local materials. The form endured because it combined low cost, reach, and simple manufacture before widespread metalworking.",
      "category": "equipmentCategory:antiCavalry",
      "yields": [
        {
          "type": "yieldType:productionCost",
          "amount": 10
        },
        {
          "type": "yieldType:strength",
          "amount": 6
        },
        {
          "type": "yieldType:strength",
          "amount": 30,
          "method": "percent",
          "vs": ["platformCategory:mounted"]
        }
      ],
    {
      "key": "equipmentType:batteringRam",
      "name": "Battering Ram",
      "concept": "conceptType:equipment",
      "description": "The battering ram was a principal tool of ancient and classical siegecraft. A heavy wooden beam, often shod with iron, was swung against gates or masonry until structural failure occurred. Assyrian reliefs show rams mounted under protective sheds with crews and sappers working together. Roman armies standardized rams within larger siege trains that included towers and earthworks. At Masada, Flavian forces drove a ramp against the fortress and used rams to attack the breached wall. Later variants hung the beam from chains to store kinetic energy and reduce friction. Defenders countered with fire, grapnels, and soft internal barricades. The ram dominated until artillery and countermining shifted siege methods.",
      "category": "equipmentCategory:siege",
      "yields": [
        {
          "type": "yieldType:productionCost",
          "amount": 20
        },
        {
          "type": "yieldType:strength",
          "amount": 7
        },
        {
          "type": "yieldType:strength",
          "amount": 30,
          "method": "percent",
          "vs": ["conceptType:urban"]
        }
      ],
    {
      "key": "routeType:dirtRoad",
      "name": "Dirt Road",
      "concept": "conceptType:route",
      "description": "Dirt roads are unpaved tracks formed by repeated travel and simple grading. They emerged in the Bronze Age alongside the earliest wheels and draft animals. Surfaces used compacted earth with occasional gravel, brush, or straw for reinforcement. Drainage depended on ruts, shallow ditches, and a crowned profile. Width matched ox carts and wagons. Sumerian trade routes between Uruk and nearby cities carried textiles, grain, and stone. Indus Valley ox-cart paths linked towns and fields. Minoan wagon tracks on Crete cut through limestone and soil. Such routes enabled migration, seasonal herding, and regional markets. They were cheap to extend but vulnerable to mud, dust, and erosion. Many medieval and early modern roads retained dirt surfaces. Numerous modern highways follow these ancient alignments.",
      "yields": [
        {
          "type": "yieldType:tradeSlot",
          "amount": 2
        },
        {
          "type": "yieldType:moveCost",
          "amount": 1,
          "method": "set"
        }
      ],
    {
      "key": "buildingType:fulfillmentCenter",
      "name": "fulfillment Center",
      "concept": "conceptType:building",
      "description": "Fulfillment centers are large distribution warehouses that store inventory, pick orders, pack goods, and dispatch parcels for rapid delivery. Their roots lie in postwar catalog houses and regional logistics depots. From the late 20th century, e-commerce scaled the model with conveyorized sortation, barcode tracking, and real-time inventory control. Amazon pioneered high-throughput designs using zone picking and robotics such as Kiva-style mobile units. In China, Alibaba’s Cainiao and JD.com operate automated hubs linking vendors to nationwide courier networks. Europe’s Ocado developed grid robots for grocery fulfillment. India and Southeast Asia host multi-tenant sites serving marketplace sellers. Proximity to airports and highways reduces cycle times. Continuous optimization in slotting, packaging, and last-mile routing underpins same-day and next-day delivery promises.",
      "category": "buildingCategory:growth",
      "yields": [
        {
          "type": "yieldType:productionCost",
          "amount": 1000
        },
        {
          "type": "yieldType:citizenSlot",
          "amount": 9,
          "for": ["conceptType:building"]
        }
      ],
   */

  it("Loads yields from types", () => {
    const bucket = useDataBucket();
    const yields = Yields.fromTypes(
      new Set([
        bucket.getType("buildingType:potter"),
        bucket.getType("buildingType:garrison"),
        bucket.getType("buildingType:wharf"),
        bucket.getType("equipmentType:axe"),
        bucket.getType("equipmentType:spear"),
        bucket.getType("equipmentType:batteringRam"),
        bucket.getType("routeType:dirtRoad"),
        bucket.getType("buildingType:fulfillmentCenter"),
      ]),
    );

    expect(yields.all()).toEqual([
      {
        amount: 30,
        for: [],
        method: "lump",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 1,
        for: ["conceptType:building"],
        method: "lump",
        type: "yieldType:citizenSlot",
        vs: [],
      },
      {
        amount: 160,
        for: [],
        method: "lump",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 8,
        for: ["platformType:human"],
        method: "lump",
        type: "yieldType:production",
        vs: [],
      },
      {
        amount: 30,
        for: [],
        method: "lump",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 1,
        for: ["improvementCategory:boats"],
        method: "lump",
        type: "yieldType:food",
        vs: [],
      },
      {
        amount: 10,
        for: [],
        method: "lump",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 15,
        for: [],
        method: "percent",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 6,
        for: [],
        method: "lump",
        type: "yieldType:strength",
        vs: [],
      },
      {
        amount: 30,
        for: [],
        method: "percent",
        type: "yieldType:strength",
        vs: ["platformType:human"],
      },
      {
        amount: 10,
        for: [],
        method: "lump",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 6,
        for: [],
        method: "lump",
        type: "yieldType:strength",
        vs: [],
      },
      {
        amount: 30,
        for: [],
        method: "percent",
        type: "yieldType:strength",
        vs: ["platformCategory:mounted"],
      },
      {
        amount: 20,
        for: [],
        method: "lump",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 7,
        for: [],
        method: "lump",
        type: "yieldType:strength",
        vs: [],
      },
      {
        amount: 30,
        for: [],
        method: "percent",
        type: "yieldType:strength",
        vs: ["conceptType:urban"],
      },
      {
        amount: 2,
        for: [],
        method: "lump",
        type: "yieldType:tradeSlot",
        vs: [],
      },
      {
        amount: 1,
        for: [],
        method: "set",
        type: "yieldType:moveCost",
        vs: [],
      },
      {
        amount: 1000,
        for: [],
        method: "lump",
        type: "yieldType:productionCost",
        vs: [],
      },
      {
        amount: 9,
        for: ["conceptType:building"],
        method: "lump",
        type: "yieldType:citizenSlot",
        vs: [],
      },
    ]);
  });

  it("handles basic operations: add, all, isEmpty", () => {
    const yields = new Yields();
    expect(yields.isEmpty).toBe(true);

    const food10: Yield = {
      type: "yieldType:food",
      amount: 10,
      method: "lump",
      for: [],
      vs: [],
    };
    yields.add(food10);

    expect(yields.isEmpty).toBe(false);
    expect(yields.all()).toEqual([food10]);
    // Check internal state exposure via getters
    expect(yields.lump).toEqual({ "yieldType:food": [food10] });
    expect(yields.percent).toEqual({});
    expect(yields.set).toEqual({});
  });

  it("handles getLumpAmount, getPercentAmount, getSetAmount", () => {
    const yields = new Yields([
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 5, method: "lump", for: [], vs: [] },
      { type: "yieldType:gold", amount: 20, method: "percent", for: [], vs: [] },
      { type: "yieldType:gold", amount: 10, method: "percent", for: [], vs: [] },
      { type: "yieldType:moves", amount: 1, method: "set", for: [], vs: [] },
    ]);

    expect(yields.getLumpAmount("yieldType:food")).toBe(15);
    expect(yields.getLumpAmount("yieldType:gold")).toBe(0);
    expect(yields.getPercentAmount("yieldType:gold")).toBe(30);
    expect(yields.getSetAmount("yieldType:moves")).toBe(1);
  });

  it("handles merge", () => {
    const food10: Yield = {
      type: "yieldType:food",
      amount: 10,
      method: "lump",
      for: [],
      vs: [],
    };
    const gold5: Yield = { type: "yieldType:gold", amount: 5, method: "lump", for: [], vs: [] };
    const yields1 = new Yields([food10]);
    const yields2 = new Yields([gold5]);

    const merged = yields1.merge(yields2);

    expect(merged.all()).toEqual([food10, gold5]);
    // Ensure original is not modified
    expect(yields1.all()).toEqual([food10]);
  });

  it("handles only() filtering", () => {
    const bucket = useDataBucket();
    const potter = bucket.getType("buildingType:potter");

    const prodCost10: Yield = {
      type: "yieldType:productionCost",
      amount: 10,
      method: "lump",
      for: [],
      vs: [],
    };
    const food5: Yield = {
      type: "yieldType:food",
      amount: 5,
      method: "lump",
      for: ["conceptType:building"],
      vs: [],
    };
    const gold2: Yield = {
      type: "yieldType:gold",
      amount: 2,
      method: "lump",
      for: [],
      vs: ["platformType:human"],
    };

    const yields = new Yields([prodCost10, food5, gold2]);

    // Filter by type
    expect(yields.only(["yieldType:productionCost"]).all()).toEqual([prodCost10]);

    // Filter by 'for' (potter has conceptType:building)
    expect(yields.only([], [potter]).all()).toEqual([prodCost10, food5, gold2]);

    // Filter by specific for
    const axe = bucket.getType("equipmentType:axe");
    expect(yields.only([], [axe]).all()).toEqual([prodCost10, gold2]);
  });

  it("handles not() filtering", () => {
    const prodCost10: Yield = {
      type: "yieldType:productionCost",
      amount: 10,
      method: "lump",
      for: [],
      vs: [],
    };
    const food5: Yield = {
      type: "yieldType:food",
      amount: 5,
      method: "lump",
      for: ["conceptType:building"],
      vs: [],
    };
    const yields = new Yields([prodCost10, food5]);

    expect(yields.not(["yieldType:productionCost"]).all()).toEqual([food5]);
  });

  it("handles toStorage", () => {
    const yields = new Yields([
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 5, method: "lump", for: [], vs: [] },
      { type: "yieldType:gold", amount: 20, method: "percent", for: [], vs: [] },
    ]);

    const storage = yields.toStorage();
    expect(storage.amount("yieldType:food")).toBe(15);
    expect(storage.amount("yieldType:gold")).toBe(0);
  });

  it("should flatten correctly", () => {
    const bucket = useDataBucket();
    const potter = bucket.getType("buildingType:potter"); // has conceptType:building, category:buildingCategory:growth
    const garrison = bucket.getType("buildingType:garrison"); // has conceptType:building, category:buildingCategory:milLand
    const human = bucket.getType("platformType:human"); // has conceptType:platform, category:platformCategory:human

    const yields = new Yields([
      // No yield types / Lump
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      // Yield types (will filter)
      { type: "yieldType:gold", amount: 20, method: "lump", for: [], vs: [] },

      // --- For Tests ---
      // For Concept (potter/garrison matches conceptType:building)
      {
        type: "yieldType:production",
        amount: 5,
        method: "lump",
        for: ["conceptType:building"],
        vs: [],
      },
      // For Category (potter matches buildingCategory:growth)
      {
        type: "yieldType:food",
        amount: 2,
        method: "lump",
        for: ["buildingCategory:growth"],
        vs: [],
      },
      // For Type (potter matches buildingType:potter)
      {
        type: "yieldType:gold",
        amount: 3,
        method: "lump",
        for: ["buildingType:potter"],
        vs: [],
      },

      // --- Vs Tests ---
      // Vs Concept (human matches conceptType:platform)
      {
        type: "yieldType:strength",
        amount: 1,
        method: "lump",
        for: [],
        vs: ["conceptType:platform"],
      },
      // Vs Category (human matches platformCategory:human)
      {
        type: "yieldType:strength",
        amount: 2,
        method: "lump",
        for: [],
        vs: ["platformCategory:human"],
      },
      // Vs Type (human matches platformType:human)
      {
        type: "yieldType:strength",
        amount: 3,
        method: "lump",
        for: [],
        vs: ["platformType:human"],
      },

      // Overwriting: set vs lump
      { type: "yieldType:moves", amount: 1, method: "lump", for: [], vs: [] },
      { type: "yieldType:moves", amount: 2, method: "set", for: [], vs: [] },
      // Merging: lump + percent
      { type: "yieldType:science", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:science", amount: 50, method: "percent", for: [], vs: [] },
    ]);

    // 1. No filters: only yields with no 'for' and no 'vs' should be included
    const flattenedNoFilters = yields.flatten();
    // Included: food(10 lump), gold(20 lump), moves(2 set -> 2 lump), science(10 lump + 50% -> 15 lump)
    expect(flattenedNoFilters.all()).toEqual([
      { type: "yieldType:moves", amount: 2, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:gold", amount: 20, method: "lump", for: [], vs: [] },
      { type: "yieldType:science", amount: 15, method: "lump", for: [], vs: [] },
    ]);

    // Assert orig yields object does not mutate on flatten
    expect(yields.all()).toHaveLength(12);

    // 2. Filter by yieldTypes
    const flattenedYieldTypes = yields.flatten(["yieldType:food", "yieldType:science"]);
    expect(flattenedYieldTypes.all()).toEqual([
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:science", amount: 15, method: "lump", for: [], vs: [] },
    ]);

    // 3. Filter by forObjs (Potter)
    const flattenedForPotter = yields.flatten([], [potter]);
    // Included:
    // moves(2), food(10), gold(20), science(15)
    // + production(5) [conceptType:building]
    // + food(2) [buildingCategory:growth]
    // + gold(3) [buildingType:potter]
    // Totals: moves: 2, food: 12, gold: 23, science: 15, production: 5
    expect(flattenedForPotter.all()).toEqual([
      { type: "yieldType:moves", amount: 2, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 12, method: "lump", for: [], vs: [] },
      { type: "yieldType:gold", amount: 23, method: "lump", for: [], vs: [] },
      { type: "yieldType:production", amount: 5, method: "lump", for: [], vs: [] },
      { type: "yieldType:science", amount: 15, method: "lump", for: [], vs: [] },
    ]);

    // 4. Filter by forObjs (Garrison)
    const flattenedForGarrison = yields.flatten([], [garrison]);
    // Included:
    // moves(2), food(10), gold(20), science(15)
    // + production(5) [conceptType:building]
    // NOT: food(2) [buildingCategory:growth - Garrison is buildingCategory:milLand]
    // NOT: gold(3) [buildingType:potter]
    expect(flattenedForGarrison.all()).toEqual([
      { type: "yieldType:moves", amount: 2, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:gold", amount: 20, method: "lump", for: [], vs: [] },
      { type: "yieldType:production", amount: 5, method: "lump", for: [], vs: [] },
      { type: "yieldType:science", amount: 15, method: "lump", for: [], vs: [] },
    ]);

    // 5. Filter by vsObjs (Human)
    const flattenedVsHuman = yields.flatten([], [], [human]);
    // Included:
    // moves(2), food(10), gold(20), science(15)
    // + strength(1) [conceptType:platform]
    // + strength(2) [platformCategory:human]
    // + strength(3) [platformType:human]
    // Total strength: 6
    expect(flattenedVsHuman.all()).toEqual([
      { type: "yieldType:moves", amount: 2, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:gold", amount: 20, method: "lump", for: [], vs: [] },
      { type: "yieldType:strength", amount: 6, method: "lump", for: [], vs: [] },
      { type: "yieldType:science", amount: 15, method: "lump", for: [], vs: [] },
    ]);

    // 6. Filter by both forObjs and vsObjs
    const flattenedBoth = yields.flatten([], [potter], [human]);
    // Included: moves(2), food(12), gold(23), science(15), production(5), strength(6)
    expect(flattenedBoth.all()).toEqual([
      { type: "yieldType:moves", amount: 2, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 12, method: "lump", for: [], vs: [] },
      { type: "yieldType:gold", amount: 23, method: "lump", for: [], vs: [] },
      { type: "yieldType:production", amount: 5, method: "lump", for: [], vs: [] },
      { type: "yieldType:strength", amount: 6, method: "lump", for: [], vs: [] },
      { type: "yieldType:science", amount: 15, method: "lump", for: [], vs: [] },
    ]);

    // 6. Overwriting ("set" vs "lump")
    // Already tested in flattenedNoFilters (moves: 1 lump, 2 set -> 2 lump)
    // Let's add more complex overwriting test
    const overwriteYields = new Yields([
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 50, method: "percent", for: [], vs: [] },
      { type: "yieldType:food", amount: 5, method: "set", for: [], vs: [] },
    ]);
    const flattenedOverwrite = overwriteYields.flatten();
    expect(flattenedOverwrite.all()).toEqual([
      { type: "yieldType:food", amount: 5, method: "lump", for: [], vs: [] },
    ]);

    // 7. Merging ("lump" + "percent")
    const mergeYields = new Yields([
      { type: "yieldType:food", amount: 10, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 5, method: "lump", for: [], vs: [] },
      { type: "yieldType:food", amount: 20, method: "percent", for: [], vs: [] },
      { type: "yieldType:food", amount: 30, method: "percent", for: [], vs: [] },
    ]);
    // (10 + 5) * (100 + 20 + 30) / 100 = 15 * 1.5 = 22.5
    const flattenedMerge = mergeYields.flatten();
    expect(flattenedMerge.all()).toEqual([
      { type: "yieldType:food", amount: 22.5, method: "lump", for: [], vs: [] },
    ]);
  });
});
