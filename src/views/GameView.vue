<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAppStore } from "@/stores/appStore";
import { destroyFullscreen, initFullscreen, toggleFullscreen } from "@/helpers/fullscreen";
import GameEngine from "@/components/Engine/Engine.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import PlayerDetailsBar from "@/components/PlayerDetails/PlayerDetailsBar.vue";
import EncyclopediaDialog from "@/components/Encyclopedia/EncyclopediaDialog.vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import PlayerDetailsDialog from "@/components/PlayerDetails/PlayerDetailsDialog.vue";
import { cityTestData } from "@/components/PlayerDetails/Tabs/cityTestData";

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
  cityTestData();
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  destroyFullscreen();
});

// Quit confirmation state & stop accidental nav-ing away
let userHasQuit = false;
const showQuitConfirm = ref(false);
function confirmQuit() {
  //showQuitConfirm.value = false;
  userHasQuit = true;
  destroyFullscreen();

  // Set browser to home to fully destroy all stores
  document.location = "/";
}
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (!userHasQuit) {
    // todo bring back
    // e.preventDefault();
  }
}
</script>

<template>
  <!-- Game Screen -->
  <v-sheet
    v-if="app.loaded"
    id="game"
    key="game"
    ref="gameRootEl"
    class="position-absolute w-100 h-100 overflow-hidden text-body-2"
  >
    <!-- Game engine -->
    <GameEngine class="absolute top-0 left-0 w-100 h-100 bg-black/50" />

    <!-- Top-left -->
    <PlayerDetailsBar />

    <!-- Top-right -->
    <div class="position-absolute top-0 right-0 d-flex ga-2" style="z-index: 10">
      <UiButton
        icon="fa-question"
        color="secondary"
        rounded="0"
        class="rounded-b-lg"
        tooltip="Encyclopedia"
        @click="useEncyclopediaStore().open()"
      />
      <UiButton
        icon="fa-up-right-and-down-left-from-center"
        color="secondary"
        rounded="0"
        class="rounded-b-lg"
        tooltip="Toggle Fullscreen"
        @click="toggleFullscreen()"
      />
      <UiButton
        id="menu-btn"
        icon="fa-bars"
        color="secondary"
        rounded="0"
        class="rounded-b-lg"
        tooltip="Menu"
      />
      <v-menu activator="#menu-btn" transition="slide-y-transition">
        <v-list density="comfortable">
          <v-list-item value="save" title="Save" />
          <v-list-item value="load" title="Load" />
          <v-list-item value="options" title="Options" />
          <v-divider class="my-1" />
          <v-list-item value="quit" title="Quit" @click="showQuitConfirm = true" />
        </v-list>
      </v-menu>
    </div>

    <!-- Left-center -->

    <!-- Right-center -->

    <!-- Bottom-left -->

    <!-- Bottom-center -->

    <!-- Bottom-right -->

    <!-- Modals -->
    <PlayerDetailsDialog v-if="app.ready" />
    <EncyclopediaDialog v-if="app.ready" />

    <!-- Quit confirmation dialog -->
    <v-dialog v-model="showQuitConfirm" max-width="378" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Confirm Quit</v-card-title>
        <v-card-text>
          Are you sure you want to Quit?<br />
          Unsaved progress may be lost.
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" @click="showQuitConfirm = false">Cancel</v-btn>
          <v-btn color="red" variant="flat" @click="confirmQuit">Quit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
