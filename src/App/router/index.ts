import { watch } from "vue";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import HomeView from "@/App/views/HomeView.vue";
import GameView from "@/App/views/GameView.vue";
import { useAppStore } from "@/App/stores/appStore";
import { useEncyclopediaStore } from "@/App/components/Encyclopedia/encyclopediaStore";
import { usePlayerDetailsStore } from "@/App/components/PlayerDetails/playerDetailsStore";

const routes: Readonly<RouteRecordRaw[]> = [
  { path: "/", name: "home", component: HomeView },
  { path: "/game", name: "game", component: GameView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to handle injection when entering /game
router.afterEach((to) => {
  if (to.name !== "home" && to.name !== "game") return;

  const appStore = useAppStore();

  // Only inject once if already set up
  if (appStore._router && Object.keys(appStore._router).length > 0) return;

  appStore.setRouter(router);

  const encStore = useEncyclopediaStore();
  const pdStore = usePlayerDetailsStore();

  // Connect the stores from above to prevent circular dependencies
  // Register URL -> UI sync functions
  appStore.uiStateListeners["enc"] = {
    id: "enc",
    onUpdate: encStore._openFromUiState,
    onClear: encStore._closeFromUiState,
  };
  appStore.uiStateListeners["pd"] = {
    id: "pd",
    onUpdate: pdStore._openFromUiState,
    onClear: pdStore._clearFromUiState,
  };

  // Register UI -> URL sync functions
  encStore.pushUiState = (key: string | undefined) => appStore.pushUiState("enc", key);
  pdStore.pushTabState = (tab: string | undefined) => appStore.pushUiState("pd", tab);
});

watch(
  () => router.currentRoute.value.fullPath,
  () => useAppStore().syncUiStateFromNav(),
);

export default router;
