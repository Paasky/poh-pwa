import { describe, expect, it } from "vitest";
import { DataBucket } from "../../src/Data/DataBucket";
import type { ParsedStaticData } from "../../src/Data/StaticDataLoader";
import type { WorldState } from "../../src/Common/Objects/Common";

describe("DataBucket Unit Tests", () => {
  const mockRawData: ParsedStaticData = {
    types: [
      {
        key: "technologyType:nomadism",
        name: "Nomadism",
        concept: "conceptType:technology",
        upgradesTo: ["technologyType:agriculture"],
      } as any,
      {
        key: "technologyType:agriculture",
        name: "Agriculture",
        concept: "conceptType:technology",
        category: "technologyCategory:ancient",
        requires: ["technologyType:nomadism"],
      } as any,
      {
        key: "conceptType:technology",
        name: "Technology",
        concept: "conceptType:concept",
      } as any,
    ],
    categories: [
      {
        key: "technologyCategory:ancient",
        name: "Ancient",
        concept: "conceptType:technology",
      } as any,
    ],
  };

  const mockWorld: WorldState = { id: "test", size: { x: 1, y: 1 }, turn: 0, year: 0 };

  it("should automate relations correctly", () => {
    const bucket = DataBucket.fromRaw(mockRawData, mockWorld);

    const nomadism = bucket.getType("technologyType:nomadism");
    const agriculture = bucket.getType("technologyType:agriculture");
    const techCategory = bucket.getCategory("technologyCategory:ancient");
    const techConcept = bucket.getType("conceptType:technology");

    // 1. Allows (Inverse of Requires)
    expect(nomadism.allows).toContain("technologyType:agriculture");

    // 2. UpgradesFrom (Inverse of UpgradesTo)
    expect(agriculture.upgradesFrom).toContain("technologyType:nomadism");

    // 3. Category relations (Populate relatesTo)
    expect(techCategory.relatesTo).toContain("technologyType:agriculture");

    // 4. Concept mapping (Group by concept)
    expect(techConcept.types).toContain("technologyType:nomadism");
    expect(techConcept.types).toContain("technologyType:agriculture");
    expect(techConcept.categories).toContain("technologyCategory:ancient");
  });

  it("should be frozen after initialization", () => {
    const bucket = DataBucket.fromRaw(mockRawData, mockWorld);
    const nomadism = bucket.getType("technologyType:nomadism");

    expect(Object.isFrozen(nomadism)).toBe(true);
    // Verify it throws in strict mode (which Vitest runs in by default)
    expect(() => {
      // @ts-ignore
      nomadism.name = "New Name";
    }).toThrow();
  });
});
