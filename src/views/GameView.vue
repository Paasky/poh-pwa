<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAppStore } from "@/stores/appStore";
import { destroyFullscreen, initFullscreen } from "@/helpers/fullscreen";
import PlayerDetailsBar from "@/components/PlayerDetails/PlayerDetailsBar.vue";
import EncyclopediaDialog from "@/components/Encyclopedia/EncyclopediaDialog.vue";
import PlayerDetailsDialog from "@/components/PlayerDetails/PlayerDetailsDialog.vue";
import Minimap from "@/components/GameView/Minimap.vue";
import TileDetails from "@/components/GameView/TileDetails.vue";
import NextAction from "@/components/GameView/NextAction.vue";
import EventsList from "@/components/GameView/EventsList.vue";
import OngoingList from "@/components/GameView/OngoingList.vue";
import GameMenu from "@/components/GameView/GameMenu.vue";

const app = useAppStore();
const gameRootEl = ref<HTMLElement | null>(null);

onMounted(async () => {
  // Warn/prevent accidental unloads (refresh/close tab) while in the game view
  window.addEventListener("beforeunload", onBeforeUnload);

  // Track fullscreen state and go fullscreen on mount
  initFullscreen();

  // Bootstrap the app data once (types + gameData) before showing the game UI
  await app.init();

  // test data
  //cityTestData();
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  destroyFullscreen();
});

// todo set to false to enable "Are you sure you want to quit?" browser prompt
// Quit confirmation state & stop accidental nav-ing away
let userHasQuit = true;

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
    v-if="app.loaded"
    id="game"
    key="game"
    ref="gameRootEl"
    class="absolute top-0 left-0 w-100 h-100 overflow-hidden"
  >
    <!-- Top-left -->
    <PlayerDetailsBar class="position-absolute top-0 left-0" style="z-index: 9" />

    <!-- Top-right -->
    <GameMenu class="position-absolute top-0 right-0" style="z-index: 10" @quit="confirmQuit" />

    <!-- Left-center (vertically centered on the axis) -->
    <OngoingList
      class="position-absolute left-0"
      style="top: 50%; transform: translateY(-50%); z-index: 8"
    />

    <!-- Right-center (vertically centered on the axis) -->
    <EventsList
      class="position-absolute right-0"
      style="top: 50%; transform: translateY(-50%); z-index: 8"
    />

    <!-- Bottom-left -->
    <Minimap class="position-absolute bottom-0 left-0" style="z-index: 10" />

    <!-- Bottom-center (horizontally centered on the axis) -->
    <TileDetails
      class="position-absolute bottom-0"
      style="left: 50%; transform: translateX(-50%); z-index: 9"
    />

    <!-- Bottom-right -->
    <NextAction class="position-absolute bottom-0 right-0" style="z-index: 10" />

    <!-- Modals -->
    <PlayerDetailsDialog v-if="app.ready" />
    <EncyclopediaDialog v-if="app.ready" />
  </v-sheet>

  <!-- Loader Screen -->
  <Transition name="fade" mode="out-in">
    <v-sheet
      v-if="!app.ready"
      key="loader"
      color="background"
      class="d-flex align-center justify-center text-center position-absolute w-100 h-100 overflow-hidden"
      style="z-index: 1000"
    >
      <div>
        <img src="/book.gif" alt="Book" width="480" height="480" decoding="async" />
        <h1 class="opacity-50">Loading the Pages of History…</h1>
      </div>
    </v-sheet>
  </Transition>
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
