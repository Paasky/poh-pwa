import { describe, expect, it, vi } from "vitest";
import { asyncProcess } from "@/Common/Helpers/asyncProcess";

describe("asyncProcess", () => {
  it("processes all items in batches", async () => {
    // Mock requestAnimationFrame
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
    });

    const items = [1, 2, 3, 4, 5];
    const processed: number[] = [];
    const progress: (number | true)[] = [];

    await asyncProcess(
      items,
      (item) => {
        processed.push(item);
      },
      (p) => {
        progress.push(p);
      },
      2, // batch size 2
      -1, // yield every move to ensure RAF is called
    );

    expect(processed).toEqual(items);
    expect(progress).toContain(40);
    expect(progress).toContain(80);
    expect(progress).toContain(100);
    expect(progress).toContain(true);

    vi.unstubAllGlobals();
  });
});
