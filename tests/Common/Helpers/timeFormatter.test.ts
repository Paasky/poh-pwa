import { describe, expect, it } from "vitest";
import { formatSaveDate } from "@/Common/Helpers/time";

describe("timeFormatter", () => {
  it("formatSaveDate returns correctly formatted date", () => {
    // We create a Date object and then verify formatSaveDate matches its components
    const d = new Date(2024, 4, 20, 15, 30); // 20 May 2024, 15:30
    const ms = d.getTime();

    // Day: 20, Month: 05, Year: 2024, Hour: 15, Min: 30
    expect(formatSaveDate(ms)).toBe("20.05.2024 15:30");
  });

  it("formatSaveDate handles single digits with padding", () => {
    const d = new Date(2024, 0, 5, 9, 5); // 5 Jan 2024, 09:05
    const ms = d.getTime();
    expect(formatSaveDate(ms)).toBe("05.01.2024 09:05");
  });
});
