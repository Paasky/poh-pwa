import { markRaw } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { GameData, StaticData } from "@/types/api";
import { EngineService } from "@/components/Engine/EngineService";
import { createWorld, worldSizes } from "@/factories/worldFactory";
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

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return (await res.json()) as Promise<T>;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    engineService: markRaw({}) as EngineService,
    loaded: false,
    uiStateListeners: markRaw({}) as Record<string, UiStateConfig>,
    _router: markRaw({}) as Router,
  }),
  actions: {
    async init(gameDataUrl?: string) {
      if (this.ready) return; // Happens on hot-reload

      // 1) Load static data to memory
      const objects = useObjectsStore();
      objects.initStatic(await fetchJSON<StaticData>("/staticData.json"));

      // 2) Build the encyclopedia after types are ready
      const encyclopedia = useEncyclopediaStore();
      encyclopedia.init();

      // 3) Load game or create a new world
      if (gameDataUrl) {
        const gameData = (await fetchJSON<GameData>(gameDataUrl)) as GameData;
        const gameObjects = new GameDataLoader().initFromRaw(gameData);
        objects.world = gameData.world;
        objects.bulkSet(Object.values(gameObjects));
      } else {
        const gameData = createWorld(worldSizes[4]);
        objects.world = gameData.world;
        objects.bulkSet(gameData.objects);
      }
      objects.ready = true;

      // 5) Initialize all tab stores (static, derived from currentPlayer/objects) before engine init
      useGovernmentTabStore().init();
      useCultureTabStore().init();
      useResearchTabStore().init();
      useReligionTabStore().init();
      useDiplomacyTabStore().init();
      useEconomyTabStore().init();
      useUnitsTabStore().init();
      useCitiesTabStore().init();
      useTradeTabStore().init();

      // 6) Initialize the game engine (throw if critical DOM is missing)
      const engineCanvas = document.getElementById("engine-canvas") as HTMLCanvasElement | null;
      if (!engineCanvas) throw new Error("Engine canvas `#engine-canvas` not found");
      const minimapCanvas = document.getElementById("minimap-canvas") as HTMLCanvasElement | null;
      if (!minimapCanvas) throw new Error("Minimap canvas `#minimap-canvas` not found");

      // Initialize settings and pass engine options
      const settings = useSettingsStore();
      settings.init();

      this.engineService = markRaw(
        new EngineService(objects.world, engineCanvas, minimapCanvas, settings.engine),
      );

      // 7) Loading is complete, tell the UI it can render
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
