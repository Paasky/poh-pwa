import { describe, expect, it } from "vitest";
import { formatYear } from "@/Common/Objects/World";
import { initTestDataBucket } from "../../../_setup/dataHelpers";
import { destroyDataBucket } from "@/Data/useDataBucket";

describe("Year formatting and DataBucket.year", () => {
  it("formatYear correctly formats BCE, CE and Seasons", () => {
    expect(formatYear(-10000)).toBe("10000 BCE");
    expect(formatYear(-1)).toBe("1 BCE");
    expect(formatYear(0)).toBe("0 CE");
    expect(formatYear(500)).toBe("500 CE");
    expect(formatYear(999)).toBe("999 CE");
    expect(formatYear(1000)).toBe("1000");
    expect(formatYear(1949)).toBe("1949");

    // Seasons (1950+)
    expect(formatYear(1950.0)).toBe("Winter 1950");
    expect(formatYear(1950.2)).toBe("Spring 1950");
    expect(formatYear(1950.5)).toBe("Summer 1950");
    expect(formatYear(1950.7)).toBe("Autumn 1950");
    expect(formatYear(1950.9)).toBe("Winter 1951");
  });

  it("DataBucket.year returns formatted year from world state", async () => {
    const bucket = await initTestDataBucket([], {
      id: "test",
      size: { x: 5, y: 5 },
      turn: 0,
      year: -5000,
      currentPlayerKey: "player:1",
    });

    expect(bucket.year).toBe("5000 BCE");

    bucket.setWorld({ year: 500 });
    expect(bucket.year).toBe("500 CE");

    bucket.setWorld({ year: 2024.5 });
    expect(bucket.year).toBe("Summer 2025"); // 2024.5 -> Winter/Spring?
    // Wait: Math.floor(2024.5) = 2024. fracRaw = 0.5. frac = 0.5.
    // if (frac < 0.625 && frac >= 0.375) -> Summer.
    // fullYear = Math.round(2024.5) = 2025.
    // So "Summer 2025".

    destroyDataBucket();
  });
});
