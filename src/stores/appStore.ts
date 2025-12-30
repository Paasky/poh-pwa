import { markRaw } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { PohEngine } from "@/Player/Human/PohEngine";
import { createWorld } from "@/factories/worldFactory";
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
import { Tile } from "@/Common/Models/Tile";
import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { City } from "@/Common/Models/City";
import { DataStore } from "@/Data/DataStore";
import { DataBucket, RawSaveData, RawStaticData } from "@/Data/DataBucket";
import { saveManager } from "@/utils/saveManager";
import { useMapGenStore } from "@/stores/mapGenStore";
import pkg from "../../package.json";
import { useCurrentContext } from "@/composables/useCurrentContext";

const APP_VERSION = pkg.version;

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return (await res.json()) as Promise<T>;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    engineService: markRaw({}) as PohEngine,
    loaded: false,
    loadTitle: "",
    loadPercent: "",
    uiStateListeners: markRaw({}) as Record<string, UiStateConfig>,
    store: {} as DataStore,

    // This will be filled in by `src/router/index.ts` using setRouter()
    _router: markRaw({}) as Router,
  }),
  actions: {
    async init(saveId?: string) {
      if (this.ready) return; // Happens on hot-reload

      async function getStaticData() {
        return await fetchJSON<RawStaticData>("/staticData.json");
      }

      const loadGame = async (saveId: string): Promise<void> => {
        this.store = markRaw(
          new DataStore(DataBucket.fromRaw(await getStaticData(), saveManager.load(saveId))),
        );
      };

      const createGame = async (): Promise<void> => {
        const worldData = createWorld(useMapGenStore().getResolvedConfig());
        const rawSave: RawSaveData = {
          name: "New Game",
          time: Date.now(),
          version: APP_VERSION,
          objects: worldData.objects,
          world: worldData.world,
        };
        this.store = markRaw(new DataStore(DataBucket.fromRaw(await getStaticData(), rawSave)));
      };

      const createEngine = (): void => {
        const engineCanvas = document.getElementById("engine-canvas") as HTMLCanvasElement | null;
        if (!engineCanvas) throw new Error("PohEngine canvas `#engine-canvas` not found");
        const minimapCanvas = document.getElementById("minimap-canvas") as HTMLCanvasElement | null;
        if (!minimapCanvas) throw new Error("Minimap canvas `#minimap-canvas` not found");

        this.engineService = markRaw(
          new PohEngine(useDataBucket().world.size, engineCanvas, minimapCanvas),
        );
      };

      await asyncProcess<{ title: string; fn: () => void | Promise<void> }>(
        [
          { title: "Load Settings", fn: () => useSettingsStore().init() },
          {
            title: saveId ? "Load Saved Game" : "Create New World",
            fn: async () => {
              if (saveId) {
                await loadGame(saveId);
              } else {
                await createGame();
              }
            },
          },
          {
            title: "Start Engine",
            fn: createEngine,
          },
          ...this.engineService.initOrder(),
          {
            title: "Load Tiles",
            fn: () =>
              useDataBucket()
                .getClassObjects<Tile>("tile")
                .forEach((t) => t.warmUp()),
          },
          {
            title: "Load Players",
            fn: () =>
              useDataBucket()
                .getClassObjects<Player>("player")
                .forEach((p) => p.warmUp()),
          },
          {
            title: "Load Cities",
            fn: () =>
              useDataBucket()
                .getClassObjects<City>("city")
                .forEach((c) => c.warmUp()),
          },
          {
            title: "Load Units",
            fn: () =>
              useDataBucket()
                .getClassObjects<Unit>("unit")
                .forEach((u) => u.warmUp()),
          },
          { title: "Initialize Encyclopedia", fn: () => useEncyclopediaStore().init() },
          { title: "Initialize Cities Tab", fn: () => useCitiesTabStore().init() },
          { title: "Initialize Culture Tab", fn: () => useCultureTabStore().init() },
          { title: "Initialize Diplomacy Tab", fn: () => useDiplomacyTabStore().init() },
          { title: "Initialize Economy Tab", fn: () => useEconomyTabStore().init() },
          { title: "Initialize Government Tab", fn: () => useGovernmentTabStore().init() },
          { title: "Initialize Religion Tab", fn: () => useReligionTabStore().init() },
          { title: "Initialize Research Tab", fn: () => useResearchTabStore().init() },
          { title: "Initialize Trade Tab", fn: () => useTradeTabStore().init() },
          { title: "Initialize Units Tab", fn: () => useUnitsTabStore().init() },
        ],
        (process): void => {
          this.loadTitle = process.title;
          process.fn();
        },
        (progress): void => {
          this.loadPercent = typeof progress === "number" ? progress + "%" : "Ready!";
        },
        1,
        1,
      );

      this.loaded = true;
    },
    async saveGame(isAutosave = false) {
      const bucket = useDataBucket();
      const currentPlayer = useCurrentContext().currentPlayer;

      const name = `${currentPlayer.leader.name} - ${currentPlayer.culture.type.name}`;
      saveManager.save(bucket.toSaveData(name, APP_VERSION), isAutosave);
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
      // IDE doesn't understand 'currentRoute' is not a ref here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = { ...(this.router.currentRoute as any).query } as Record<string, string>;

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
        // IDE doesn't understand 'currentRoute' is not a ref here
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query = (this.router.currentRoute as any).query;
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
        throw new Error("Router.currentRoute does not exist");
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
