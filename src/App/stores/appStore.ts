import { Engine } from "@babylonjs/core";
import { defineStore } from "pinia";
import { markRaw, Ref } from "vue";
import type { Router } from "vue-router";
import { useDataBucket } from "@/Data/useDataBucket";
import { useEncyclopediaStore } from "@/App/components/Encyclopedia/encyclopediaStore";
import { PohEngine } from "@/Actor/Human/PohEngine";
import { useGovernmentTabStore } from "@/App/components/PlayerDetails/Tabs/governmentTabStore";
import { useCultureTabStore } from "@/App/components/PlayerDetails/Tabs/cultureTabStore";
import { useResearchTabStore } from "@/App/components/PlayerDetails/Tabs/researchTabStore";
import { useReligionTabStore } from "@/App/components/PlayerDetails/Tabs/religionTabStore";
import { useDiplomacyTabStore } from "@/App/components/PlayerDetails/Tabs/diplomacyTabStore";
import { useEconomyTabStore } from "@/App/components/PlayerDetails/Tabs/economyTabStore";
import { useUnitsTabStore } from "@/App/components/PlayerDetails/Tabs/unitsTabStore";
import { useCitiesTabStore } from "@/App/components/PlayerDetails/Tabs/citiesTabStore";
import { useTradeTabStore } from "@/App/components/PlayerDetails/Tabs/tradeTabStore";
import { Task } from "@/Common/Helpers/asyncProcess";
import { Player } from "@/Common/Models/Player";
import { saveManager } from "@/Common/utils/saveManager";
import { SaveAction } from "@/Actor/Human/Actions/SaveAction";
import { setCurrentPlayer } from "@/Common/composables/useCurrentContext";
import { CurrentGame } from "@/Conductor/CurrentGame";
import { useMapGenStore } from "@/App/stores/mapGenStore";

export const useAppStore = defineStore("app", {
  state: () => ({
    pohEngine: markRaw({}) as PohEngine,
    loaded: false,
    loadTitle: "",
    loadPercent: "",
    uiStateListeners: markRaw({}) as Record<string, UiStateConfig>,
    currentGame: {} as CurrentGame,

    // This will be filled in by `src/router/index.ts` using setRouter()
    _router: markRaw({}) as Ref<Router>,
  }),
  actions: {
    async init(saveId?: string, engine?: Engine) {
      if (this.ready) return; // Happens on hot-reload

      // Prep: Logic to hook DOM -> PohEngine -> appStore
      const createEngine = (): void => {
        const engineCanvas = document.getElementById("engine-canvas") as HTMLCanvasElement | null;
        if (!engineCanvas) throw new Error("PohEngine canvas `#engine-canvas` not found");
        const minimapCanvas = document.getElementById("minimap-canvas") as HTMLCanvasElement | null;
        if (!minimapCanvas) throw new Error("Minimap canvas `#minimap-canvas` not found");

        this.pohEngine = markRaw(
          new PohEngine(useDataBucket().world.size, engineCanvas, minimapCanvas),
        );
      };

      // Prep: Once the Current Game is ready, perform these UI tasks
      const tasks: Task[] = [
        {
          title: "Set Current Player",
          fn: (): void => {
            const bucket = useDataBucket();
            setCurrentPlayer(bucket.getObject<Player>(bucket.world.currentPlayerKey));
          },
        },
        { title: "Start Engine", fn: createEngine.bind(this) },
        {
          title: "Engine Subsystems",
          fn: async () => {
            const engineTasks = this.pohEngine.initOrder(engine);
            for (const task of engineTasks) {
              await task.fn();
            }
          },
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

      // Action: Boot up the Current Game
      this.currentGame = markRaw(
        new CurrentGame(
          saveId
            ? CurrentGame.loadGameTask(saveManager.load(saveId))
            : CurrentGame.newGameTask(useMapGenStore().getResolvedConfig()),
          {
            id: saveId,
            extraTasks: tasks,
            progressCallback: (task, progress) => {
              this.loadTitle = task.title;
              this.loadPercent = typeof progress === "number" ? progress + "%" : "Ready!";
            },
          },
        ),
      );

      await this.currentGame.ready;
      this.loaded = true;
      this.syncUiStateFromNav();
    },

    async saveGame(name?: string, isAutosave = false) {
      SaveAction.save(name, isAutosave);
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
