import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { worldLinks } from "@/Common/WorldLinks";
import { initTestDataBucket } from "./_setup/dataHelpers";

describe("WorldLinks", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await initTestDataBucket();

    // Reset the singleton
    (worldLinks as any).initialized = false;
    (worldLinks as any).continentToRegions.clear();
    (worldLinks as any).regionToCultures.clear();
    (worldLinks as any).registry.clear();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  describe("Static Data Integrity", () => {
    it("should satisfy all structural requirements for continents, regions, cultures, and leaders", () => {
      const bucket = useDataBucket();
      const continents = bucket.getClassTypes("continentType");
      const errors: string[] = [];

      continents.forEach((continent) => {
        const regions = Array.from(
          worldLinks.only({
            continents: [continent.key],
            typeClasses: ["regionType"],
          }),
        );

        // Each continent has 4 regions
        if (regions.length !== 4) {
          errors.push(`Continent ${continent.key} has ${regions.length} regions (expected 4)`);
        }

        regions.forEach((region) => {
          const regionCultures = Array.from(
            worldLinks.only({
              regions: [region.key],
              typeClasses: ["majorCultureType", "minorCultureType"],
            }),
          );

          const majorCultures = regionCultures.filter((c) => c.class === "majorCultureType");
          const minorCultures = regionCultures.filter((c) => c.class === "minorCultureType");

          // Each region has a major culture timeline 5 long
          const startMajors = majorCultures.filter((c) => c.upgradesFrom.length === 0);
          if (startMajors.length !== 1) {
            errors.push(
              `Region ${region.key} has ${startMajors.length} starting major cultures (expected 1)`,
            );
          } else {
            const majorTimeline = worldLinks.getTimeline(startMajors[0]);
            if (majorTimeline.length !== 5) {
              errors.push(
                `Region ${region.key} major culture timeline is ${majorTimeline.length} long (expected 5)`,
              );
            }

            // Each region's major cultures has a leader
            majorTimeline.forEach((culture) => {
              const leaders = worldLinks.only({
                cultures: [culture.key],
                typeClasses: ["majorLeaderType"],
              });
              if (leaders.length !== 1) {
                errors.push(
                  `Major culture ${culture.key} in region ${region.key} has ${leaders.length} leaders (expected 1)`,
                );
              }
            });
          }

          // Each region has 2 minor culture timelines, both 2 long
          const startMinors = minorCultures.filter((c) => c.upgradesFrom.length === 0);
          if (startMinors.length !== 2) {
            errors.push(
              `Region ${region.key} has ${startMinors.length} starting minor cultures (expected 2)`,
            );
          } else {
            startMinors.forEach((startMinor) => {
              const minorTimeline = worldLinks.getTimeline(startMinor);
              if (minorTimeline.length !== 2) {
                errors.push(
                  `Region ${region.key} minor culture timeline starting with ${startMinor.key} is ${minorTimeline.length} long (expected 2)`,
                );
              }

              // Each region's minor cultures has a leader
              minorTimeline.forEach((culture) => {
                const leaders = worldLinks.only({
                  cultures: [culture.key],
                  typeClasses: ["minorLeaderType"],
                });
                if (leaders.length !== 1) {
                  errors.push(
                    `Minor culture ${culture.key} in region ${region.key} has ${leaders.length} leaders (expected 1)`,
                  );
                }
              });
            });
          }
        });
      });

      expect(errors, "Static data integrity errors found:\n" + errors.join("\n")).toHaveLength(0);
    });
  });

  describe("only()", () => {
    it("should filter by continent", () => {
      // Use real data keys from staticData.json
      const results = Array.from(worldLinks.only({ continents: ["continentType:america"] }));
      const keys = results.map((r) => r.key);
      expect(keys).toContain("regionType:greatLakes");
      // With real data, we just check if it contains some expected items
      expect(keys.some((k) => k.startsWith("majorCultureType:"))).toBe(true);
      expect(keys.some((k) => k.startsWith("majorLeaderType:"))).toBe(true);
    });

    it("should filter by region", () => {
      const results = Array.from(worldLinks.only({ regions: ["regionType:greatLakes"] }));
      const keys = results.map((r) => r.key);
      expect(keys.some((k) => k.startsWith("majorCultureType:"))).toBe(true);
      expect(keys.some((k) => k.startsWith("minorCultureType:"))).toBe(true);
      expect(keys.some((k) => k.startsWith("majorLeaderType:"))).toBe(true);
      expect(keys).not.toContain("continentType:america");
    });

    it("should filter by culture", () => {
      const results = Array.from(worldLinks.only({ cultures: ["majorCultureType:hopewell"] }));
      const keys = results.map((r) => r.key);
      expect(keys).toContain("majorCultureType:hopewell");
      expect(keys.some((k) => k.startsWith("majorLeaderType:"))).toBe(true);
    });

    it("should filter by leader", () => {
      const results = Array.from(worldLinks.only({ leaders: ["majorLeaderType:sakima"] }));
      const keys = results.map((r) => r.key);
      expect(keys).toContain("majorCultureType:hopewell");
      expect(keys).toContain("majorLeaderType:sakima");
    });

    it("should filter by era", () => {
      const era1 = Array.from(worldLinks.only({ eras: [1] }));
      expect(era1.length).toBeGreaterThan(0);
      expect(
        era1.every((obj) => {
          const meta = (worldLinks as any).registry.get(obj.key);
          return meta.era === 1;
        }),
      ).toBe(true);

      const era5 = Array.from(worldLinks.only({ eras: [5] }));
      expect(era5.length).toBeGreaterThan(0);
      expect(
        era5.every((obj) => {
          const meta = (worldLinks as any).registry.get(obj.key);
          return meta.era === 5;
        }),
      ).toBe(true);
    });

    it("should filter by isMinor", () => {
      const minors = Array.from(worldLinks.only({ isMinor: true }));
      expect(minors.length).toBeGreaterThan(0);
      expect(minors.every((m) => m.class.startsWith("minor"))).toBe(true);
    });

    it("should combine filters", () => {
      const results = Array.from(
        worldLinks.only({
          continents: ["continentType:america"],
          typeClasses: ["majorLeaderType"],
          eras: [1],
        }),
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.class === "majorLeaderType")).toBe(true);
    });
  });

  describe("getTimeline()", () => {
    it("should return culture timeline", () => {
      const bucket = useDataBucket();
      const hopewell = bucket.getType("majorCultureType:hopewell");
      const timeline = worldLinks.getTimeline(hopewell);
      expect(timeline.length).toBeGreaterThanOrEqual(2);
      expect(timeline[0].key).toBe("majorCultureType:hopewell");
    });

    it("should return leader timeline when given a leader", () => {
      const bucket = useDataBucket();
      const sakima = bucket.getType("majorLeaderType:sakima");
      const timeline = worldLinks.getTimeline(sakima);
      expect(timeline.length).toBeGreaterThanOrEqual(2);
      expect(timeline[0].key).toBe("majorLeaderType:sakima");
    });
  });
});
