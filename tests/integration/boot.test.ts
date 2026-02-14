// SMOKE TEST — verifies the app boots with a pre-seeded world.
// Does not validate every subsystem exhaustively; see dedicated unit tests for those.

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { NullEngine } from "@babylonjs/core";
import fs from "fs";
import path from "path";
import type { Router } from "vue-router";
import type { Player } from "@/Common/Models/Player";
import { useAppStore } from "@/App/stores/appStore";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { initTestDataBucket } from "../_setup/dataHelpers";
import { createTestWorld, TestWorldState } from "../_setup/testWorld";
import { populateTestPlayers } from "../_setup/worldHelpers";
import { SAVE_PREFIX } from "@/Common/utils/saveManager";

vi.mock("@babylonjs/core/Misc/screenshotTools", () => ({
  CreateScreenshotUsingRenderTarget: vi.fn((_engine, _camera, _size, callback) => {
    callback(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    );
  }),
}));

const server = setupServer(
  http.get("/data/*", ({ request }) => {
    const url = new URL(request.url);
    const relativePath = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
    const dataPath = path.resolve(process.cwd(), "public", relativePath);
    if (!fs.existsSync(dataPath)) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(JSON.parse(fs.readFileSync(dataPath, "utf-8")));
  }),
  http.get("/env/environment.env", () => new HttpResponse(null, { status: 404 })),
  http.get("https://assets.babylonjs.com/core/environments/backgroundSkybox.dds", () => {
    return new HttpResponse(null, { status: 404 });
  }),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

beforeEach(async () => {
  setActivePinia(createPinia());
  localStorage.clear();

  document.body.innerHTML = `
    <div id="app">
      <canvas id="engine-canvas"></canvas>
      <canvas id="minimap-canvas"></canvas>
    </div>
  `;

  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0),
  );

  await initTestDataBucket();
  createTestWorld();
  populateTestPlayers(2);

  const routerStub = {
    currentRoute: { value: { query: {} } },
    push: vi.fn(),
    replace: vi.fn(),
  };
  useAppStore().setRouter(routerStub as unknown as Router);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  server.resetHandlers();
  destroyDataBucket();
});

describe("Game Boot Sequence", () => {
  it("boots from a saved world and initialises the engine and bucket", async () => {
    const saveData = useDataBucket().toSaveData("Boot Test", "0.1.0");
    localStorage.setItem(`${SAVE_PREFIX}${TestWorldState.id}`, JSON.stringify(saveData));

    const app = useAppStore();
    const engine = new NullEngine();
    vi.spyOn(engine, "runRenderLoop").mockImplementation(() => {});
    const booting = app.init(TestWorldState.id, engine);
    await vi.advanceTimersByTimeAsync(50);
    await booting;

    expect(app.loaded).toBe(true);
    expect(app.pohEngine.engine).toBeDefined();
    expect(app.pohEngine.scene).toBeDefined();

    const bucket = useDataBucket();
    expect(bucket.world.id).toBe(TestWorldState.id);
    expect(bucket.world.size).toEqual(TestWorldState.size);
    expect(bucket.world.currentPlayerKey).toBeDefined();

    expect(bucket.getClassObjects("tile").size).toBe(150);
    expect(bucket.getClassObjects("player").size).toBe(2);

    const human = bucket.getObject<Player>(bucket.world.currentPlayerKey!);
    expect(human.isHuman).toBe(true);
    expect(human.culture.type.class).toBe("majorCultureType");
  });
});
