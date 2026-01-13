import { afterEach, describe, expect, it, vi } from "vitest";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { CurrentGame } from "@/Conductor/CurrentGame";
import { playerRawData, tileRawData } from "../../_setup/dataHelpers";
import { Task } from "@/Common/Helpers/asyncProcess";
import { WorldState } from "@/Common/Objects/World";
import { GameKey } from "@/Common/Models/_GameTypes";

describe("CurrentGame", () => {
  afterEach(() => {
    destroyDataBucket();
    vi.restoreAllMocks();
  });

  it("Happy Path - New Game Orchestration", async () => {
    const playerKey: GameKey = "player:human";
    const aiPlayerKey: GameKey = "player:ai";
    const world: WorldState = {
      id: "test-world",
      size: { x: 10, y: 10 },
      turn: 0,
      year: 0,
      currentPlayerKey: playerKey,
    };

    const initGameTask: Task = {
      title: "Creating World",
      fn: () => {
        const bucket = useDataBucket();
        bucket.setWorld(world);
        bucket.setRawObjects([
          ...playerRawData(playerKey, { isHuman: true, name: "Human" }),
          ...playerRawData(aiPlayerKey, { isHuman: false, name: "AI" }),
          ...tileRawData("tile:0:0"),
        ]);
      },
    };

    const progressCallback = vi.fn();
    const game = new CurrentGame(initGameTask, { progressCallback });

    // Wait for async process to finish
    // Since asyncProcess uses requestAnimationFrame, we might need to wait or mock it.
    // However, in vitest/jsdom environment, we can usually just wait for the promise.
    // The constructor doesn't return the promise, but asyncProcess is called.

    // To properly test this, we should ideally have a way to await the game initialization.
    // Let's check how asyncProcess is called in CurrentGame.
    // asyncProcess(tasks, (task) => task.fn(), props?.progressCallback);

    // We can wrap the test in a promise that resolves when progressCallback is called with true.
    await new Promise<void>((resolve) => {
      const originalCallback = progressCallback;
      progressCallback.mockImplementation((task, progress) => {
        if (progress === true) {
          resolve();
        }
      });
    });

    expect(game.currentPlayer?.key).toBe(playerKey);
    expect(game.aiBrains?.size).toBe(1);
    expect(game.aiBrains?.has(aiPlayerKey)).toBe(true);
    expect(useDataBucket().getClassObjects("player").size).toBe(2);
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Ready" }),
      true,
    );
  });

  it("Scenario: Multiplayer Server Mode", async () => {
    const aiPlayerKey1: GameKey = "player:ai1";
    const aiPlayerKey2: GameKey = "player:ai2";
    const world: WorldState = {
      id: "server-world",
      size: { x: 10, y: 10 },
      turn: 0,
      year: 0,
    };

    const initGameTask: Task = {
      title: "Loading Server World",
      fn: () => {
        const bucket = useDataBucket();
        bucket.setWorld(world);
        bucket.setRawObjects([
          ...playerRawData(aiPlayerKey1, { isHuman: false, name: "AI 1" }),
          ...playerRawData(aiPlayerKey2, { isHuman: false, name: "AI 2" }),
        ]);
      },
    };

    const progressCallback = vi.fn();
    const game = new CurrentGame(initGameTask, { progressCallback });

    await new Promise<void>((resolve) => {
      progressCallback.mockImplementation((task, progress) => {
        if (progress === true) resolve();
      });
    });

    expect(game.currentPlayer).toBeUndefined();
    expect(game.aiBrains?.size).toBe(2);
    expect(game.aiBrains?.has(aiPlayerKey1)).toBe(true);
    expect(game.aiBrains?.has(aiPlayerKey2)).toBe(true);
  });

  it("Failure Path - Task Propagation", async () => {
    const errorMsg = "Task Failed";
    const failingTask: Task = {
      title: "Failing Task",
      fn: () => {
        throw new Error(errorMsg);
      },
    };

    await expect(
      new Promise((_, reject) => {
        const handler = (event: PromiseRejectionEvent) => {
          if (event.reason.message === errorMsg) {
            event.preventDefault();
            reject(event.reason);
          }
        };
        window.addEventListener("unhandledrejection", handler);
        new CurrentGame(failingTask);
      }),
    ).rejects.toThrow(errorMsg);
  });

  it("Progress Verification", async () => {
    const p1Key: GameKey = "player:p1";
    const p2Key: GameKey = "player:p2";
    const world: WorldState = {
      id: "progress-world",
      size: { x: 5, y: 5 },
      turn: 0,
      year: 0,
      currentPlayerKey: p1Key,
    };

    const initGameTask: Task = {
      title: "Init",
      fn: () => {
        useDataBucket().setWorld(world);
        useDataBucket().setRawObjects([
          ...playerRawData(p1Key, { name: "P1" }),
          ...playerRawData(p2Key, { name: "P2" }),
        ]);
      },
    };

    const progressCallback = vi.fn();
    new CurrentGame(initGameTask, { progressCallback });

    await new Promise<void>((resolve) => {
      progressCallback.mockImplementation((task, progress) => {
        if (progress === true) resolve();
      });
    });

    // Check if progress was called with various tasks
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Loading Static Data" }),
      expect.any(Number),
    );
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Init" }),
      expect.any(Number),
    );
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Initializing P1" }),
      expect.any(Number),
    );
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Initializing P2" }),
      expect.any(Number),
    );
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Ready" }),
      true,
    );
  });
});
