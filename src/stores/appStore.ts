import { markRaw } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { GameData, StaticData } from "@/types/api";
import { EngineService } from "@/components/Engine/EngineService";
import { createWorld, WorldSize, worldSizes } from "@/factories/worldFactory";
import { GameDataLoader } from "@/dataLoaders/GameDataLoader";
import type { Router } from "vue-router";
import { useGovernmentTabStore } from "@/components/PlayerDetails/Tabs/governmentTabStore";
import { useCultureTabStore } from "@/components/PlayerDetails/Tabs/cultureTabStore";
import { useResearchTabStore } from "@/components/PlayerDetails/Tabs/researchTabStore";
import { useReligionTabStore } from "@/components/PlayerDetails/Tabs/religionTabStore";
import { useDiplomacyTabStore } from "@/components/PlayerDetails/Tabs/diplomacyTabStore";
import { useEconomyTabStore } from "@/components/PlayerDetails/Tabs/economyTabStore";
import { useUnitsTabStore } from "@/components/PlayerDetails/Tabs/unitsTabStore";
import { useCitiesTabStore } from "@/components/PlayerDetails/Tabs/citiesTabStore";
import { useTradeTabStore } from "@/components/PlayerDetails/Tabs/tradeTabStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { asyncProcess } from "@/helpers/asyncProcess";
import { Tile } from "@/objects/game/Tile";
import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return (await res.json()) as Promise<T>;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    engineService: markRaw({}) as EngineService,
    loaded: false,
    loadPercent: "",
    uiStateListeners: markRaw({}) as Record<string, UiStateConfig>,
    _router: markRaw({}) as Router,
  }),
  actions: {
    async init(gameDataUrl?: string) {
      if (this.ready) return; // Happens on hot-reload

      // Download data & Init Object Store
      const staticData = await fetchJSON<StaticData>("/staticData.json");
      const saveGameData = gameDataUrl
        ? ((await fetchJSON<GameData>(gameDataUrl)) as GameData)
        : null;
      const size = saveGameData?.world.size ?? worldSizes[4];

      const objStore = useObjectsStore();
      const settings = useSettingsStore();

      const engineCanvas = document.getElementById("engine-canvas") as HTMLCanvasElement | null;
      if (!engineCanvas) throw new Error("Engine canvas `#engine-canvas` not found");
      const minimapCanvas = document.getElementById("minimap-canvas") as HTMLCanvasElement | null;
      if (!minimapCanvas) throw new Error("Minimap canvas `#minimap-canvas` not found");

      this.engineService = markRaw(new EngineService(size, engineCanvas, minimapCanvas));

      await asyncProcess(
        [
          () => objStore.initStatic(staticData),
          () => {
            if (saveGameData) {
              objStore.world = saveGameData.world;
              const gameObjects = new GameDataLoader().initFromRaw(saveGameData);
              objStore.bulkSet(Object.values(gameObjects));
            } else {
              let tries = 0;
              do {
                try {
                  const gameData = createWorld(size as WorldSize);
                  objStore.world = gameData.world;
                  objStore.bulkSet(gameData.objects);

                  break;
                } catch (e) {
                  tries++;
                  if (tries >= 5) throw e;

                  // eslint-disable-next-line
                  console.warn("Failed to create world, retrying...", e);
                }
              } while (tries < 5);
            }
            objStore.ready = true;
          },
          () => (objStore.getClassGameObjects("player") as Player[]).forEach((p) => p.warmUp()),
          () => (objStore.getClassGameObjects("tile") as Tile[]).forEach((t) => t.warmUp()),
          () => (objStore.getClassGameObjects("unit") as Unit[]).forEach((u) => u.warmUp()),
          () => useEncyclopediaStore().init(),
          () => settings.init(),
          ...this.engineService.initOrder(),
          () => useGovernmentTabStore().init(),
          () => useCultureTabStore().init(),
          () => useResearchTabStore().init(),
          () => useReligionTabStore().init(),
          () => useDiplomacyTabStore().init(),
          () => useEconomyTabStore().init(),
          () => useUnitsTabStore().init(),
          () => useCitiesTabStore().init(),
          () => useTradeTabStore().init(),
        ],
        (fn): void => fn(),
        (progress): void => {
          this.loadPercent = typeof progress === "number" ? progress + "%" : "Ready!";
        },
        1,
        1,
      );

      this.loaded = true;
    },

    // Process for UI event -> sync to URL (URL is the source of truth for UI state)
    // NOTE: Never update UI state manually, always wrap through this!
    // UI state pushers are configured in routes/index.ts
    //
    // Process is: (encyclopediaStore as example)
    // User triggers `encStore.open(key)`
    // -> encStore runs this.pushUiState(storeId, key)
    // -> router redirects the push here (this prevents circular dependencies)
    // -> I set to router & nav history
    // -> router watcher triggers my syncUiStateFromNav()
    // -> I trigger _openFromUiState(key) / _closeFromUiState() for relevant state listeners (as confed in router)
    pushUiState(id: string, value: string | undefined) {
      // Modify current query params to reflect the new UI state
      const query = { ...this.router.currentRoute.value.query } as Record<string, string>;

      if (value === undefined) {
        // Remove from the query (if exists)
        delete query[id];
      } else {
        // Exact same value -> do nothing
        if (query[id] === value) {
          return;
        }
        // Set the new value
        query[id] = value;
      }

      // If the previous UI state value was empty (aka open without context)
      // -> replace the previous nav with new one
      // Example: I open encyclopedia without context, then open a specific entry
      // -> when I click back, I expect the encyclopedia to close (instead of not changing any content)
      if (this.uiStateListeners[id].prevKey === "") {
        // Replace prev history (this will trigger syncUiStateFromNav())
        this.router.replace({ query });
        this.uiStateListeners[id].prevKey = value;
        return;
      }

      // Keep track of previous entries
      this.uiStateListeners[id].prevKey = value;

      // Push to history (this will trigger syncUiStateFromNav())
      this.router.push({ query });
    },

    // Process for sync from URL (the source of truth) -> UI state
    // NOTE: Never update UI state manually, always listen for this!
    // UI state listeners are configured in router/index.ts
    syncUiStateFromNav() {
      try {
        const query = this.router.currentRoute.value.query;
        // Update each registered UI state
        for (const cfg of Object.values(this.uiStateListeners)) {
          if (query[cfg.id] === undefined) {
            // Does not exist in query -> clear the data from UI
            cfg.onClear();
          } else {
            // Has data in query -> update the UI

            // IDE doesn't understand that `query` is a regular object
            // eslint-disable-next-line
            cfg.onUpdate((query as any)[cfg.id]);
          }
        }
      } catch {
        return;
      }
    },

    // NOTE: Only called by router/index.ts
    setRouter(router: Router) {
      if (!router.currentRoute) {
        throw new Error("Router.currentRoute does not exist");
      }
      if (!router.currentRoute.value) {
        throw new Error("Router.currentRoute.value does not exist");
      }
      // eslint-disable-next-line
      this._router = markRaw(router) as any; // this is where .value magically disappears
    },
  },
  getters: {
    ready: (state): boolean => state.loaded && !!state._router,
    router: (state): Router => {
      if (!state._router) throw new Error("Router not initialized");

      // IDE is confused of the type, so cast it back to Router
      // eslint-disable-next-line
      return state._router as any as Router;
    },
  },
});

type UiStateConfig = {
  id: string; // Must be unique
  onUpdate: (value: string) => void;
  onClear: () => void;
  prevKey?: string; // Internal use only
};
