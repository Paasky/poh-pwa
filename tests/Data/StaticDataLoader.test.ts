import { describe, expect, it } from "vitest";
import { load } from "@/Data/StaticDataLoader";
import { CompiledStaticData } from "@/Data/StaticDataCompiler";
import { Yields } from "@/Common/Static/Objects/Yields";
import { Requires } from "@/Common/Static/Objects/Requires";

describe("StaticDataLoader", () => {
  describe("load()", () => {
    // Shared dataset for multiple test cases (KISS & DRY)
    const mockCompiledData: CompiledStaticData = {
      categories: [
        {
          key: "buildingCategory:test",
          name: "Test Category",
          concept: "conceptType:building",
          description: "A test category",
          allows: ["buildingType:test"],
          relatesTo: ["buildingType:test"],
        },
      ],
      types: [
        {
          key: "buildingType:test",
          name: "Test Building",
          names: { en: "Test Building", fi: "Testirakennus" },
          concept: "conceptType:building",
          category: "buildingCategory:test",
          description: "A full-featured test building",
          productionCost: 100,
          scienceCost: 50,
          yields: [
            { type: "yieldType:productionCost", amount: 100, method: "lump", for: [], vs: [] },
            { type: "yieldType:scienceCost", amount: 50, method: "lump", for: [], vs: [] },
            { type: "yieldType:gold", amount: 5, method: "lump", for: [], vs: [] },
          ],
          requires: ["buildingType:base", ["buildingType:alt1", "buildingType:alt2"]],
          allows: ["buildingType:advanced"],
          relatesTo: ["buildingCategory:test"],
          upgradesFrom: ["buildingType:old"],
          upgradesTo: ["buildingType:new"],
          actions: ["actionType:move"],
          // Exception: Testing runtime validation of invalid types
          specials: ["specialType:againstYourIncident"],
          gains: [],
        },
        {
          key: "equipmentType:minimal",
          description: "Description",
          name: "Minimal Equipment",
          // Exception: Testing runtime validation of invalid types
          concept: "conceptType:equipment",
          allows: [],
          relatesTo: [],
          upgradesTo: [],
          upgradesFrom: [],
          yields: [],
          requires: [],
          actions: [],
          specials: [],
          gains: [],
        },
      ],
    };

    describe("Successful loading and data preservation", () => {
      it("should correctly load and preserve all fields from CompiledStaticData", () => {
        const { types, categories } = load(mockCompiledData);

        // Assert that types and categories Maps are created with correct sizes
        expect(types.size).toBe(2);
        expect(categories.size).toBe(1);

        // Assert that 'buildingType:test' exists and its fields match input
        const building = types.get("buildingType:test")!;
        expect(building).toBeDefined();
        expect(building.name).toBe("Test Building");
        expect(building.description).toBe("A full-featured test building");
        expect(building.category).toBe("buildingCategory:test");

        // Assert that localized 'names' record is preserved
        expect(building.names).toEqual({ en: "Test Building", fi: "Testirakennus" });

        // Assert that relational arrays are preserved
        expect(building.allows).toEqual(["buildingType:advanced"]);
        expect(building.relatesTo).toEqual(["buildingCategory:test"]);
        expect(building.upgradesFrom).toEqual(["buildingType:old"]);
        expect(building.upgradesTo).toEqual(["buildingType:new"]);
        expect(building.actions).toEqual(["actionType:move"]);
        expect(building.specials).toEqual(["specialType:test"]);

        // Assert that 'equipmentType:minimal' is loaded correctly
        const minimal = types.get("equipmentType:minimal")!;
        expect(minimal).toBeDefined();
        expect(minimal.name).toBe("Minimal Unit");
        expect(minimal.allows).toEqual([]);

        // Assert that 'buildingCategory:test' exists and all its fields are preserved
        const category = categories.get("buildingCategory:test")!;
        expect(category).toBeDefined();
        expect(category.name).toBe("Test Category");
        expect(category.description).toBe("A test category");
        expect(category.allows).toEqual(["buildingType:test"]);
        expect(category.relatesTo).toEqual(["buildingType:test"]);
        // Logic check: getClassAndConcept derives concept from className. "buildingCategory" -> "conceptType:building"
        expect(category.concept).toBe("conceptType:building");
        expect(category.class).toBe("buildingCategory");
        // Assert icon generation for categories
        expect(category.icon).toBeDefined();
        expect(category.icon.icon).toBeDefined();
        expect(category.icon.color).toBeDefined();
      });
    });

    describe("Runtime Object Initialization (Logic & Helpers)", () => {
      it("should initialize rich runtime properties and helper classes", () => {
        const { types } = load(mockCompiledData);
        const building = types.get("buildingType:test")!;

        // Assert Class & Concept Derivation Logic
        expect(building.class).toBe("buildingType");
        // Note: getClassAndConcept derives concept from className. "buildingType" -> "conceptType:building"
        expect(building.concept).toBe("conceptType:building");

        // Assert Yields helper class
        expect(building.yields).toBeInstanceOf(Yields);
        expect(building.yields.all().length).toBe(3);
        expect(building.yields.getLumpAmount("yieldType:gold")).toBe(5);

        // Assert Requires helper class (parsing OR logic)
        expect(building.requires).toBeInstanceOf(Requires);
        expect(building.requires.requireAll.has("buildingType:base")).toBe(true);
        expect(building.requires.requireAny.size).toBe(1);

        // Assert automatic cost mapping
        expect(building.productionCost).toBe(100);
        expect(building.scienceCost).toBe(50);

        // Assert icon generation
        expect(building.icon).toBeDefined();
        expect(building.icon.icon).toBeDefined();
        expect(building.icon.color).toBeDefined();
      });
    });

    describe("Integrity of Maps", () => {
      it("should maintain strict mapping between Map keys and object keys", () => {
        const { types, categories } = load(mockCompiledData);

        types.forEach((obj, key) => {
          expect(key).toBe(obj.key);
          // Check for common transformations on all types
          expect(obj.class).toBeDefined();
          expect(obj.concept).toBeDefined();
          expect(obj.icon).toBeDefined();
        });

        categories.forEach((obj, key) => {
          expect(key).toBe(obj.key);
          // Check for common transformations on all categories
          expect(obj.class).toBeDefined();
          expect(obj.concept).toBeDefined();
          expect(obj.icon).toBeDefined();
        });
      });
    });

    describe("Edge Cases & Error Handling", () => {
      it("should return empty maps when provided with empty input", () => {
        const { types, categories } = load({ types: [], categories: [] });
        expect(types.size).toBe(0);
        expect(categories.size).toBe(0);
      });

      it("should accumulate and throw multiple errors for malformed data", () => {
        const badData: CompiledStaticData = {
          categories: [],
          types: [
            // Exception: Testing runtime validation of invalid types
            { key: "invalidKey", name: "Bad", concept: "conceptType:test" },
            // Exception: Testing runtime validation of invalid types
            {
              key: "wrongType:key",
              name: "Bad2",
              concept: "conceptType:test",
            },
          ],
        };

        expect(() => load(badData)).toThrow();
        try {
          load(badData);
        } catch (e: any) {
          expect(e.message).toContain("invalidKey");
          expect(e.message).toContain("wrongType:key");
        }
      });

      it("should handle null or missing optional fields by providing defaults", () => {
        const minimalData: CompiledStaticData = {
          categories: [],
          types: [
            // Exception: Testing runtime validation of invalid types
            {
              key: "buildingType:minimal",
              name: "Minimal",
              concept: "conceptType:building",
              // missing yields, actions, etc.
            },
          ],
        };

        const { types } = load(minimalData);
        const minimal = types.get("buildingType:minimal")!;

        expect(minimal.yields).toBeInstanceOf(Yields);
        expect(minimal.yields.all()).toEqual([]);
        expect(minimal.actions).toEqual([]);
        expect(minimal.specials).toEqual([]);

        // Assert Yields defaults
        expect(minimal.productionCost).toBe(0);
      });
    });
  });
});
