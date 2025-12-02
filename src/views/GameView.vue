<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAppStore } from "@/stores/appStore";
import { useRouter } from "vue-router";
import { initModalStateSync } from "@/router/modalState";
import { destroyFullscreen, initFullscreen, toggleFullscreen } from "@/helpers/fullscreen";
import GameEngine from "@/components/Engine/Engine.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import EncyclopediaDialog from "@/components/Encyclopedia/EncyclopediaDialog.vue";

const app = useAppStore();
const router = useRouter();
const gameRootEl = ref<HTMLElement | null>(null);

// Top-left primary buttons data
type DetailItem = {
  id: string;
  iconClass: string; // FontAwesome class
  iconColor: string; // theme color key (matches vuetify theme colors)
  text: string;
  effect: { text: string; color?: string };
  tooltip: string;
};

const detailData: DetailItem[] = [
  {
    id: "economy",
    iconClass: "fa-coins",
    iconColor: "gold",
    text: "12",
    effect: { text: "-3", color: "red" },
    tooltip: "Economy",
  },
  {
    id: "research",
    iconClass: "fa-flask",
    iconColor: "lightBlue",
    text: "234 (5)",
    effect: { text: "+123" },
    tooltip: "Research: Rifling 234/789 (5 turns)",
  },
  {
    id: "culture",
    iconClass: "fa-masks-theater",
    iconColor: "lightPurple",
    text: "234 (5)",
    effect: { text: "+123" },
    tooltip: "Culture: 234/789 to next Golden Age  (5 turns)",
  },
  {
    id: "religion",
    iconClass: "fa-hands-praying",
    iconColor: "darkPurple",
    text: "234 (5)",
    effect: { text: "+123" },
    tooltip: "Religion: 234/789 to next God  (5 turns)",
  },
  {
    id: "diplomacy",
    iconClass: "fa-scroll",
    iconColor: "lightGray",
    text: "3",
    effect: { text: "5/8", color: "green" },
    tooltip: "Diplomacy: 3 Agendas, 5/8 units in use",
  },
  {
    id: "trade",
    iconClass: "fa-route",
    iconColor: "orange",
    text: "12",
    effect: { text: "(8)", color: "green" },
    tooltip: "Trade: 12 active routes, 8 available",
  },
  {
    id: "units",
    iconClass: "fa-shield",
    iconColor: "gray",
    text: "4",
    effect: { text: "(6)", color: "green" },
    tooltip: "Units: 4 Available Designs, 6 design points",
  },
  {
    id: "cities",
    iconClass: "fa-city",
    iconColor: "white",
    text: "6",
    effect: { text: "8%" },
    tooltip: "Cities: 8% discontent",
  },
  {
    id: "government",
    iconClass: "fa-landmark",
    iconColor: "white",
    text: "Stable",
    effect: { text: "12%" },
    tooltip: "Government: No revolt risk, 12% Corruption",
  },
];

onMounted(async () => {
  // Warn/prevent accidental unloads (refresh/close tab) while in the game view
  window.addEventListener("beforeunload", onBeforeUnload);

  // Track fullscreen state and go fullscreen on mount
  initFullscreen();

  // Bootstrap the app data once (types + gameData) before showing the game UI
  await app.init();

  // Initialize URL/history syncing for modals and tabs/types after data is ready
  initModalStateSync(router);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  destroyFullscreen();
});

let userHasQuit = false;
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (!userHasQuit) {
    e.preventDefault();
  }
}

// Quit confirmation state
const showQuitConfirm = ref(false);

function onQuitRequested() {
  showQuitConfirm.value = true;
}

function confirmQuit() {
  showQuitConfirm.value = false;
  userHasQuit = true;
  // Set browser to home to fully destroy all stores
  document.location = "/";
}
</script>

<template>
  <Transition name="fade" mode="out-in">
    <!-- Loader Screen -->
    <v-sheet
      v-if="!app.ready"
      key="loader"
      color="background"
      class="d-flex align-center justify-center text-center"
      height="100vh"
      width="100vw"
    >
      <div>
        <v-img src="/book.gif" alt="Book" contain />
        <h1 class="opacity-50">Loading the Pages of History…</h1>
      </div>
    </v-sheet>

    <!-- Game Screen -->
    <v-sheet
      v-else
      id="game"
      key="game"
      ref="gameRootEl"
      class="position-absolute w-100 h-100 overflow-hidden text-body-2"
    >
      <!-- Game engine -->
      <GameEngine class="absolute top-0 left-0 w-100 h-100 bg-black/50" />

      <!-- Top-left -->
      <div class="position-absolute top-0 left-0 d-flex flex-wrap ga-1" style="z-index: 10">
        <UiButton
          v-for="item in detailData"
          :key="item.id"
          :icon="item.iconClass"
          :icon-color="item.iconColor"
          :text="item.text"
          :effect-text="item.effect.text"
          :effect-class="item.effect.color"
          :tooltip="item.tooltip"
          color="secondary"
          rounded="0"
          size="small"
          class="rounded-b-lg"
        />
      </div>

      <!-- Top-right -->
      <div class="position-absolute top-0 right-0 d-flex ga-2" style="z-index: 10">
        <UiButton
          icon="fa-question"
          color="tertiary"
          rounded="0"
          class="rounded-b-lg"
          tooltip="Encyclopedia"
        />
        <UiButton
          icon="fa-up-right-and-down-left-from-center"
          color="tertiary"
          rounded="0"
          class="rounded-b-lg"
          tooltip="Toggle Fullscreen"
          @click="toggleFullscreen()"
        />
        <UiButton icon="fa-bars" color="tertiary" rounded="0" class="rounded-b-lg" tooltip="Menu" />
        <v-menu activator="parent" transition="slide-y-transition" location="bottom end">
          <v-list density="comfortable">
            <v-list-item value="save" title="Save" />
            <v-list-item value="load" title="Load" />
            <v-list-item value="options" title="Options" />
            <v-divider class="my-1" />
            <v-list-item value="quit" title="Quit" @click="onQuitRequested" />
          </v-list>
        </v-menu>
      </div>

      <!-- Left-center -->

      <!-- Right-center -->

      <!-- Bottom-left -->

      <!-- Bottom-center -->

      <!-- Bottom-right -->

      <!-- Modals -->
      <!-- Encyclopedia -->
      <EncyclopediaDialog />

      <!-- Quit confirmation dialog -->
      <v-dialog v-model="showQuitConfirm" max-width="1440" persistent>
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
  </Transition>
</template>

<!--suppress CssUnusedSymbol -->
<style>
/**********************
 Fade transition (loader <-> game)
**********************/
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
