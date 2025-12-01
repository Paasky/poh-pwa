import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { GameData, StaticData } from "@/types/api";
import { EngineService } from "@/components/Engine/engine";
import { createWorld, worldSizes } from "@/factories/worldFactory";
import { GameDataLoader } from "@/dataLoaders/GameDataLoader";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return (await res.json()) as Promise<T>;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    ready: false,
  }),
  actions: {
    async init(gameDataUrl?: string) {
      if (this.ready) return; // Happens on hot-reload

      const objects = useObjectsStore();
      objects.initStatic(await fetchJSON<StaticData>("/staticData.json"));

      // Build encyclopedia menu once after types are ready
      const encyclopedia = useEncyclopediaStore();
      encyclopedia.init();

      // Load game or create a new world
      if (gameDataUrl) {
        const gameData = (await fetchJSON<GameData>(gameDataUrl)) as GameData;
        const gameObjects = new GameDataLoader().initFromRaw(gameData);
        objects.world = gameData.world;
        objects.bulkSet(Object.values(gameObjects));
      } else {
        const gameData = createWorld(worldSizes[2]);
        objects.world = gameData.world;
        objects.bulkSet(gameData.objects);
      }
      objects.ready = true;

      // Initialize the game engine
      await EngineService.init(objects.world);

      this.ready = true;
    },
  },
});
