<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAppStore } from "@/App/stores/appStore";
import { destroyFullscreen, initFullscreen } from "@/Common/Helpers/fullscreen";
import PlayerDetailsBar from "@/App/components/PlayerDetails/PlayerDetailsBar.vue";
import EncyclopediaDialog from "@/App/components/Encyclopedia/EncyclopediaDialog.vue";
import PlayerDetailsDialog from "@/App/components/PlayerDetails/PlayerDetailsDialog.vue";
import Minimap from "@/App/components/GameView/Minimap.vue";
import TileDetails from "@/App/components/GameView/TileDetails.vue";
import NextAction from "@/App/components/GameView/NextAction.vue";
import EventsList from "@/App/components/GameView/EventsList.vue";
import OngoingList from "@/App/components/GameView/OngoingList.vue";
import GameMenu from "@/App/components/GameView/GameMenu.vue";
import UiUnitCard from "@/App/components/Ui/UiUnitCard.vue";
import { useMovementInteraction } from "@/Common/composables/useMovementInteraction";
import { useCurrentContext } from "@/Common/composables/useCurrentContext";
import { Unit } from "@/Common/Models/Unit";
import { HotkeyManager } from "@/Actor/Human/HotkeyManager";

const app = useAppStore();
const context = useCurrentContext();
const gameRootEl = ref<HTMLElement | null>(null);

onMounted(async () => {
  // Global Hotkeys
  HotkeyManager.init();
  // Warn/prevent accidental unloads (refresh/close tab) while in the game view
  window.addEventListener("beforeunload", onBeforeUnload);

  // Track fullscreen state and go fullscreen on mount
  initFullscreen();

  // Bootstrap the app data once (types + gameData) before showing the game UI
  await app.init(app.router.currentRoute.value.query.saveId as string | undefined);

  // Initialize movement cameras orchestrator
  useMovementInteraction();

  // test data
  //cityTestData();
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  app.pohEngine.dispose();
  destroyFullscreen();
});

// Quit confirmation state & stop accidental nav-ing away
// Set to false to enable the "Are you sure you want to quit?" browser prompt
let userHasQuit = true;

function confirmReload() {
  userHasQuit = true;
  destroyFullscreen();

  // Set the browser to home to fully destroy all stores
  document.location.reload();
}
function confirmQuit() {
  userHasQuit = true;
  destroyFullscreen();

  // Set the browser to home to fully destroy all stores
  document.location = "/";
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (!userHasQuit) {
    e.preventDefault();
  }
}
</script>

<template>
  <!-- Loader Screen -->
  <Transition name="fade" mode="out-in">
    <v-sheet
      v-if="!app.ready"
      key="loader"
      color="background"
      class="d-flex align-center justify-center text-center"
      style="
        display: block;
        position: absolute;
        z-index: 100;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
      "
    >
      <div>
        <img src="/book.gif" alt="Book" width="480" height="480" decoding="async" />
        <h1 class="opacity-50">Loading the Pages of History…</h1>
        <h2 class="opacity-50" v-if="app.loadTitle">{{ app.loadTitle }} - {{ app.loadPercent }}</h2>
      </div>
    </v-sheet>
  </Transition>

  <!-- Game engine -->
  <canvas
    id="engine-canvas"
    style="
      display: block;
      position: absolute;
      z-index: 0;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
    "
  />

  <!-- Game Screen -->
  <v-sheet
    id="game"
    key="game"
    ref="gameRootEl"
    class="absolute top-0 left-0 w-100 h-100 overflow-hidden"
  >
    <!-- Top-left -->
    <PlayerDetailsBar v-if="app.loaded" class="position-absolute top-0 left-0" />

    <!-- Top-right -->
    <GameMenu
      v-if="app.loaded"
      class="position-absolute top-0 right-0"
      @reload="confirmReload"
      @quit="confirmQuit"
    />

    <!-- Left-center (vertically centered on the axis) -->
    <OngoingList
      v-if="app.loaded"
      class="position-absolute left-0"
      style="top: 50%; transform: translateY(-50%); z-index: 8"
    />

    <!-- Right-center (vertically centered on the axis) -->
    <EventsList
      v-if="app.loaded"
      class="position-absolute right-0"
      style="top: 50%; transform: translateY(-50%); z-index: 8"
    />

    <!-- Bottom-left -->
    <v-sheet
      color="secondary"
      class="d-flex position-absolute bottom-0 left-0 rounded-tr-lg pt-1 pr-1"
    >
      <Minimap />
      <TileDetails v-if="app.loaded" />
      <UiUnitCard
        v-if="context.object.value?.class === 'unit'"
        v-model="context.object as unknown as Unit"
      />
    </v-sheet>

    <!-- Bottom-right -->
    <NextAction v-if="app.loaded" class="position-absolute bottom-0 right-0" />

    <!-- Modals -->
    <PlayerDetailsDialog v-if="app.ready" />
    <EncyclopediaDialog v-if="app.ready" />
  </v-sheet>
</template>

<!--suppress CssUnusedSymbol -->
<style>
/**********************
 Fade transition (loader <-> game)
**********************/
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1000ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
