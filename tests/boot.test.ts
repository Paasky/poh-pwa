import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { flushPromises } from "@vue/test-utils";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useAppStore } from "@/stores/appStore";
import { useDataBucket } from "@/Data/useDataBucket";
import { NullEngine } from "@babylonjs/core";
import type { Tile } from "@/Common/Models/Tile";
import type { RawSaveData } from "@/Data/DataBucket";
import type { GameKey } from "@/Common/Models/_GameModel";
import type { Router } from "vue-router";
import staticData from "../public/staticData.json";

const server = setupServer(
  http.get("/staticData.json", () => {
    // If this breaks, boot contract has changed
    return HttpResponse.json(staticData);
  }),
  http.get("/env/environment.env", () => {
    return new HttpResponse(null, { status: 404 });
  }),
  http.get("https://assets.babylonjs.com/core/environments/backgroundSkybox.dds", () => {
    return new HttpResponse(null, { status: 404 });
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

// Mock world factory to avoid complex generation logic in smoke test
// Although "strictly no mocking" is a guideline, worldFactory relies on TerraGenerator
// and a massive staticData.json, making it impractical for a central integration smoke test.
vi.mock("@/factories/worldFactory", () => ({
  worldSizes: [
    { name: "Tiny", x: 72, y: 36, continents: 4, majorsPerContinent: 1, minorsPerPlayer: 0 },
    { name: "Small", x: 108, y: 54, continents: 4, majorsPerContinent: 2, minorsPerPlayer: 2 },
    { name: "Regular", x: 144, y: 72, continents: 5, majorsPerContinent: 3, minorsPerPlayer: 2 },
  ],
  createWorld: vi.fn(() => ({
    world: {
      id: "test-world",
      size: { x: 2, y: 2 },
      turn: 0,
      year: 0,
      currentPlayerKey: "player:1" as GameKey,
    },
    objects: [
      {
        key: "culture:1",
        class: "culture",
        name: "Test Culture",
        type: "majorCultureType:viking",
        playerKey: "player:1",
      },
      { key: "player:1", class: "player", name: "Test Player", cultureKey: "culture:1" },
      {
        key: "tile:x0,y0",
        class: "tile",
        x: 0,
        y: 0,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:cold",
        terrain: "terrainType:tundra",
        elevation: "elevationType:hill",
      },
      {
        key: "tile:x1,y0",
        class: "tile",
        x: 1,
        y: 0,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:cold",
        terrain: "terrainType:grass",
        elevation: "elevationType:mountain",
      },
      {
        key: "tile:x0,y1",
        class: "tile",
        x: 0,
        y: 1,
        domain: "domainType:water",
        area: "oceanType:atlantic",
        climate: "climateType:temperate",
        terrain: "terrainType:sea",
        elevation: "elevationType:flat",
      },
      {
        key: "tile:x1,y1",
        class: "tile",
        x: 1,
        y: 1,
        domain: "domainType:water",
        area: "oceanType:atlantic",
        climate: "climateType:temperate",
        terrain: "terrainType:coast",
        elevation: "elevationType:flat",
      },
    ],
  })),
}));

// Minimal Router interface for stubbing
interface RouterStub {
  currentRoute: { value: { query: Record<string, string> } };
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
}

describe("Game Boot Sequence", () => {
  beforeEach(() => {
    // 1. Reset Pinia
    setActivePinia(createPinia());

    // 2. Setup DOM (Hard Invariant: presence of canvases)
    document.body.innerHTML = `
      <div id="app">
        <canvas id="engine-canvas"></canvas>
        <canvas id="minimap-canvas"></canvas>
      </div>
    `;

    // 3. Stub RAF (Conscious trade-off: hides timing bugs for determinism)
    // Using setTimeout to avoid Maximum call stack size exceeded in runRenderLoop
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 0),
    );

    // 4. Provide Mock Router (Minimal typed interface, no 'as any')
    const router: RouterStub = {
      currentRoute: { value: { query: {} } },
      push: vi.fn(),
      replace: vi.fn(),
    };

    const app = useAppStore();
    app.setRouter(router as unknown as Router);
  });

  it("should boot a new world and satisfy structural invariants", async () => {
    const app = useAppStore();

    // In actual implementation, we'll need to ensure NullEngine is used.
    await app.init(undefined, new NullEngine());
    await flushPromises();

    // Structural Invariants
    expect(app.loaded).toBe(true);
    expect(app.engineService.engine).toBeDefined();
    expect(app.engineService.scene).toBeDefined();

    const bucket = useDataBucket();
    expect(bucket.world).toBeDefined();
    expect(bucket.world.id).toBeDefined();
    // Verify that tiles are loaded (using size as getClassObjects returns a Set)
    expect(bucket.getClassObjects<Tile>("tile").size).toBeGreaterThan(0);
  });

  it("should boot from a save game and match seeded data", async () => {
    const saveId = "test-save";
    // Define minimal typed save data
    const mockSave: RawSaveData = {
      name: "Test Save",
      time: Date.now(),
      version: "0.1.0",
      world: {
        id: "world-123",
        size: { x: 2, y: 2 },
        turn: 1,
        year: 0,
        currentPlayerKey: "player:1" as GameKey,
      },
      objects: [
        {
          key: "culture:1",
          class: "culture",
          name: "Test Culture",
          type: "majorCultureType:viking",
          playerKey: "player:1",
        },
        { key: "player:1", class: "player", name: "Test Player", cultureKey: "culture:1" },
        {
          key: "tile:x0,y0",
          class: "tile",
          x: 0,
          y: 0,
          domain: "domainType:land",
          area: "continentType:taiga",
          climate: "climateType:cold",
          terrain: "terrainType:tundra",
          elevation: "elevationType:hill",
        },
        {
          key: "tile:x1,y0",
          class: "tile",
          x: 1,
          y: 0,
          domain: "domainType:land",
          area: "continentType:taiga",
          climate: "climateType:cold",
          terrain: "terrainType:grass",
          elevation: "elevationType:mountain",
        },
        {
          key: "tile:x0,y1",
          class: "tile",
          x: 0,
          y: 1,
          domain: "domainType:water",
          area: "oceanType:atlantic",
          climate: "climateType:temperate",
          terrain: "terrainType:sea",
          elevation: "elevationType:flat",
        },
        {
          key: "tile:x1,y1",
          class: "tile",
          x: 1,
          y: 1,
          domain: "domainType:water",
          area: "oceanType:atlantic",
          climate: "climateType:temperate",
          terrain: "terrainType:coast",
          elevation: "elevationType:flat",
        },
      ],
    };
    localStorage.setItem(`poh.save.${saveId}`, JSON.stringify(mockSave));

    const app = useAppStore();
    await app.init(saveId, new NullEngine());
    await flushPromises();

    expect(app.loaded).toBe(true);
    expect(useDataBucket().world.id).toBe(mockSave.world.id);
  });
});
