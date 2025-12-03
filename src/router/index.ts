import { watch } from "vue";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import HomeView from "@/views/HomeView.vue";
import GameView from "@/views/GameView.vue";
import MapGeneratorView from "@/views/MapGeneratorView.vue";
import { useAppStore } from "@/stores/appStore";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";

const routes: Readonly<RouteRecordRaw[]> = [
  { path: "/", name: "home", component: HomeView },
  { path: "/game", name: "game", component: GameView },
  { path: "/generator", name: "generator", component: MapGeneratorView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Inject the router into the appStore so it can be used for UI <-> URL state syncing
// This is a bit hacky, but it works like a dream :star:
// The interval should not be needed, but there's an off-chance
// that the router is not yet ready when the appStore is created
const injectIt = () => {
  try {
    const appStore = useAppStore();
    appStore.setRouter(router);

    // Validate that the router is injected properly (it will lose the .value that my router has)
    if (
      appStore._router?.currentRoute?.fullPath == router.currentRoute.value.fullPath &&
      appStore._router.currentRoute.query == router.currentRoute.value.query
    ) {
      const encStore = useEncyclopediaStore();

      // Connect the stores from above to prevent circular dependencies
      // Register URL -> UI sync functions
      appStore.uiStateListeners["enc"] = {
        id: "enc",
        onUpdate: encStore._openFromUiState,
        onClear: encStore._closeFromUiState,
      };
      // Register UI -> URL sync functions
      encStore.pushUiState = (key: string | undefined) => appStore.pushUiState("enc", key);

      // Success! Stop trying to inject
      clearInterval(injector);

      // Run initial sync between UI state <-> URL before turning on the watcher
      appStore.syncUiStateFromNav();
      watch(
        () => router.currentRoute.value.fullPath,
        () => useAppStore().syncUiStateFromNav(),
      );
      return;
    }
    // eslint-disable-next-line
    console.warn("Failed, appStore._router.currentRoute: ", appStore._router?.currentRoute);
  } catch (e) {
    // eslint-disable-next-line
    console.warn("Failed to inject router into appStore: " + e);
  }
};
const injector = setInterval(injectIt, 100);

export default router;
