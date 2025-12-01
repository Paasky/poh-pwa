import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import {
  TabName,
  tabsConfig,
  usePlayerDetailsStore,
} from "@/components/PlayerDetails/playerDetailsStore";
import { TypeKey } from "@/types/common";

// Query param keys (new simplified schema)
const Q_PD = "pd"; // value: TabKey or '' (exists but empty => open PD without switching)
const Q_ENC = "enc"; // value: typeKey or '' (exists but empty => open ENC with current=null)

function buildQueryFromState(route: RouteLocationNormalizedLoaded) {
  const encyclopedia = useEncyclopediaStore();
  const playerDetails = usePlayerDetailsStore();

  const current = { ...route.query } as Record<string, string>;

  // Encyclopedia
  if (encyclopedia.isOpen) {
    current[Q_ENC] = encyclopedia.current ? encyclopedia.current.key : "";
  } else {
    delete current[Q_ENC];
  }

  // Player Details
  if (playerDetails.isOpen) {
    // When PD is open, encode the active tab. If you want only-open, set to ''
    current[Q_PD] = playerDetails.activeTab || "";
  } else {
    delete current[Q_PD];
  }

  return current;
}

function applyRouteToStores(route: RouteLocationNormalizedLoaded) {
  const encyclopedia = useEncyclopediaStore();
  const playerDetails = usePlayerDetailsStore();

  const encParam = route.query[Q_ENC] as string;
  const pdParam = route.query[Q_PD] as string;

  // PlayerDetails
  if (pdParam === "") {
    playerDetails.open(); // keep current tab
  } else if (tabsConfig.find((c) => c.name === pdParam)) {
    playerDetails.open(pdParam as TabName);
  } else {
    // Invalid tab -> just ensure closed
    playerDetails.close();
  }

  // Encyclopedia
  if (encParam === "") {
    // Open ENC but clear current
    encyclopedia.current = null;
    encyclopedia.open();
  } else if (encParam) {
    try {
      encyclopedia.open(encParam as TypeKey);
    } catch {
      encyclopedia.open();
    }
  }
}

export function initModalStateSync(router: Router) {
  const encyclopedia = useEncyclopediaStore();
  const playerDetails = usePlayerDetailsStore();

  const { isOpen: encOpen, current } = storeToRefs(encyclopedia);
  const { isOpen: pdOpen, activeTab } = storeToRefs(playerDetails);

  let applyingFromRoute = false;
  let pushingFromStores = false;

  // Apply current route once on init
  applyingFromRoute = true;
  applyRouteToStores(router.currentRoute.value);
  applyingFromRoute = false;

  // Update stores when route changes (back/forward or manual URL edits)
  router.afterEach((to) => {
    if (pushingFromStores) return;
    applyingFromRoute = true;
    applyRouteToStores(to);
    applyingFromRoute = false;
  });

  // Watch stores and push query updates, creating history entries
  function pushFromState() {
    if (applyingFromRoute) return;
    const to = router.currentRoute.value;
    const nextQuery = buildQueryFromState(to);

    // Only push if something actually changed
    const same = shallowEqualQuery(
      to.query as Record<string, string>,
      nextQuery,
    );
    if (same) return;

    pushingFromStores = true;
    router.push({ query: nextQuery }).finally(() => {
      pushingFromStores = false;
    });
  }

  watch([encOpen, current], pushFromState);
  watch([pdOpen, activeTab], pushFromState);
}

function shallowEqualQuery(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const va = a[k];
    const vb = b[k];
    if (Array.isArray(va) || Array.isArray(vb)) return false; // we only use scalar query values here
    if (va !== vb) return false;
  }
  return true;
}
