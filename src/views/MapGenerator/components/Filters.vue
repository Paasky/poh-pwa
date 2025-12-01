<script setup lang="ts">
defineOptions({ name: "MapGenFilters" });
import UiButton from "@/components/Ui/UiButton.vue";
import { useMapGenStore } from "@/stores/mapGenStore";
// import { useObjectsStore } from "@/stores/objectStore";

const store = useMapGenStore();
// const _objStore = useObjectsStore();

function toggle(key: keyof typeof store.toggles) {
  store.toggle(key);
}
</script>

<template>
  <div
    class="mx-auto w-full max-w-full min-w-[72rem] mt-2 flex flex-wrap items-center gap-2"
  >
    <UiButton
      :variant="store.toggles.showTerrain ? 'selected' : 'ghost'"
      @click="toggle('showTerrain')"
    >
      Terrain
    </UiButton>
    <UiButton
      :variant="store.toggles.showAreas ? 'selected' : 'ghost'"
      @click="toggle('showAreas')"
    >
      Areas
    </UiButton>
    <UiButton
      :variant="store.toggles.showMajorStarts ? 'selected' : 'ghost'"
      @click="toggle('showMajorStarts')"
    >
      Player starts
    </UiButton>
    <UiButton
      :variant="store.toggles.showRivers ? 'selected' : 'ghost'"
      @click="toggle('showRivers')"
    >
      Rivers
    </UiButton>
    <UiButton
      :variant="store.toggles.showFreshSalt ? 'selected' : 'ghost'"
      @click="toggle('showFreshSalt')"
    >
      Fresh/Salt
    </UiButton>
    <UiButton
      :variant="store.toggles.showElevation ? 'selected' : 'ghost'"
      @click="toggle('showElevation')"
    >
      Elevation
    </UiButton>
    <UiButton
      :variant="store.toggles.showFeatures ? 'selected' : 'ghost'"
      @click="toggle('showFeatures')"
    >
      Features
    </UiButton>
  </div>
</template>

<style scoped></style>
