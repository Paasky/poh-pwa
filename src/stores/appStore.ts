import { Engine } from "@babylonjs/core";
import { defineStore } from "pinia";
import { markRaw, Ref } from "vue";
import type { Router } from "vue-router";
import { hasDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { PohEngine } from "@/Player/Human/PohEngine";
import { createWorld } from "@/factories/worldFactory";
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
import { saveManager } from "@/utils/saveManager";
import { useMapGenStore } from "@/stores/mapGenStore";
import pkg from "../../package.json";
import { setCurrentPlayer, useCurrentContext } from "@/composables/useCurrentContext";
import { DataBucket } from "@/Data/DataBucket";

const APP_VERSION = pkg.version;

export const useAppStore = defineStore("app", {
  state: () => ({
    engineService: markRaw({}) as PohEngine,
    loaded: false,
    loadTitle: "",
    loadPercent: "",
    uiStateListeners: markRaw({}) as Record<string, UiStateConfig>,
    store: {} as DataStore,

    // This will be filled in by `src/router/index.ts` using setRouter()
    _router: markRaw({}) as Ref<Router>,
  }),
  actions: {
    async init(saveId?: string, engine?: Engine) {
      if (this.ready) return; // Happens on hot-reload

      type TaskDefinition = () => void | Promise<void>;

      const loadGame = async (saveId: string): Promise<void> => {
        const rawSaveData = saveManager.load(saveId);
        const dataBucket = useDataBucket();
        dataBucket.setWorld(rawSaveData.world);
        dataBucket.setRawObjects(rawSaveData.objects);

        this.store = markRaw(new DataStore(dataBucket));
      };

      const createGame = async (): Promise<void> => {
        const dataBucket = useDataBucket();
        const worldConfig = useMapGenStore().getResolvedConfig();

        // Set a partial World (used by World Factory)
        dataBucket.setWorld(worldConfig.worldState);

        const worldBundle = createWorld(worldConfig);

        // Set the full World State and Objects from the generated bundle
        dataBucket.setWorld(worldBundle.world);
        dataBucket.setRawObjects(worldBundle.objects);

        this.store = markRaw(new DataStore(dataBucket));
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

      // PHASE 1: Data & Settings
      // Data-layer completion is a hard precondition for Phase 2.
      const dataTasks: { title: string; fn: TaskDefinition }[] = [
        {
          title: "Load Static Data",
          fn: () => {
            if (!hasDataBucket()) {
              DataBucket.init();
            }
          },
        },
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
      ];

      await asyncProcess(
        dataTasks,
        async (task) => {
          this.loadTitle = task.title;
          await task.fn();
        },
        (progress) => {
          this.loadPercent = typeof progress === "number" ? progress + "%" : "Data Ready";
        },
      );

      // Set current player context
      const bucket = useDataBucket();
      setCurrentPlayer(bucket.getObject<Player>(bucket.world.currentPlayerKey));

      // Initialize Engine Service (Data is now available for map size)
      createEngine();

      // PHASE 2: Graphics & UI
      // engineService.initOrder() exposes boot sequencing intentionally.
      const engineTasks = [
        ...this.engineService.initOrder(engine),
        {
          title: "Load Tiles",
          fn: () => bucket.getClassObjects<Tile>("tile").forEach((t) => t.warmUp()),
        },
        {
          title: "Load Players",
          fn: () => bucket.getClassObjects<Player>("player").forEach((p) => p.warmUp()),
        },
        {
          title: "Load Cities",
          fn: () => bucket.getClassObjects<City>("city").forEach((c) => c.warmUp()),
        },
        {
          title: "Load Units",
          fn: () => bucket.getClassObjects<Unit>("unit").forEach((u) => u.warmUp()),
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
      ];

      await asyncProcess(
        engineTasks,
        (task) => {
          this.loadTitle = task.title;
          task.fn();
        },
        (progress) => {
          this.loadPercent = typeof progress === "number" ? progress + "%" : "Ready!";
        },
      );

      this.loaded = true;
      this.syncUiStateFromNav();
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
      const query = this.router.currentRoute.value.query;
      // Update each registered UI state
      for (const cfg of Object.values(this.uiStateListeners)) {
        if (query[cfg.id] === undefined) {
          // Does not exist in query -> clear the data from UI
          cfg.onClear();
        } else {
          // Has data in query -> update the UI
          cfg.onUpdate(query[cfg.id] as string);
        }
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
      this._router = markRaw(router);
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
