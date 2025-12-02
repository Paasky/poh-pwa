<script setup lang="ts">
import { onMounted } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import UiButton from "@/components/UiLegacy/UiButton.vue";
import Controls from "@/views/MapGenerator/components/Controls.vue";
import Filters from "@/views/MapGenerator/components/Filters.vue";
import LevelSection from "@/views/MapGenerator/components/LevelSection.vue";
import { StaticData } from "@/types/api";
import { useMapGenStore } from "@/stores/mapGenStore";

const objStore = useObjectsStore();
const mapGenStore = useMapGenStore();

// Ensure static types are loaded for the generator
async function ensureTypesReady() {
  if (objStore.ready) return;
  const res = await fetch("/staticData.json", { cache: "no-store" });
  const staticData: StaticData = await res.json();
  objStore.initStatic(staticData);
}

onMounted(async () => {
  await ensureTypesReady();
  mapGenStore.init();
});
</script>

<template>
  <div class="w-screen bg-gray-900 text-slate-100">
    <div class="w-full p-4 space-y-6">
      <h1 class="text-3xl font-semibold">Map Generator</h1>
      <div v-if="!mapGenStore.gen" class="text-center text-lg opacity-50 animate-pulse">
        Loading...
      </div>
      <div v-else>
        <Controls />

        <Filters />

        <!-- LEVEL TOGGLES -->
        <div class="mx-auto w-full max-w-full min-w-[72rem] mt-2 flex items-center gap-2">
          <UiButton
            :variant="mapGenStore.selectedLevel === 'strat' ? 'selected' : 'ghost'"
            @click="mapGenStore.selectedLevel = 'strat'"
          >
            Strategic
          </UiButton>
          <UiButton
            :variant="mapGenStore.selectedLevel === 'reg' ? 'selected' : 'ghost'"
            @click="mapGenStore.selectedLevel = 'reg'"
          >
            Region
          </UiButton>
          <UiButton
            :variant="mapGenStore.selectedLevel === 'game' ? 'selected' : 'ghost'"
            @click="mapGenStore.selectedLevel = 'game'"
          >
            Game
          </UiButton>
        </div>

        <!-- STRATEGIC LEVEL -->
        <LevelSection v-if="mapGenStore.selectedLevel === 'strat'" variant="strat" />

        <!-- REGION LEVEL -->
        <LevelSection v-if="mapGenStore.selectedLevel === 'reg'" variant="reg" />

        <!-- GAME LEVEL -->
        <LevelSection v-if="mapGenStore.selectedLevel === 'game'" variant="game" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
