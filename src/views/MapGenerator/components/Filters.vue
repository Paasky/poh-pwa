<script setup lang="ts">
import UiButton from '@/components/Ui/UiButton.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useMapGenStore } from '@/stores/mapGenStore'
import { useObjectsStore } from '@/stores/objectStore'

const store = useMapGenStore()
const objStore = useObjectsStore()

function toggle (key: keyof typeof store.toggles) {
  store.toggle(key)
}
</script>

<template>
  <div class="mx-auto w-full max-w-full min-w-[72rem] mt-2 flex flex-wrap items-center gap-2">
    <UiButton :variant="store.toggles.showLegends ? 'selected' : 'ghost'" @click="toggle('showLegends')">Show legends</UiButton>
    <UiButton :variant="store.toggles.showTerrain ? 'selected' : 'ghost'" @click="toggle('showTerrain')">Terrain colors</UiButton>
    <UiButton :variant="store.toggles.showAreaInitials ? 'selected' : 'ghost'" @click="toggle('showAreaInitials')">Area initials</UiButton>
    <UiButton :variant="store.toggles.showAreas ? 'selected' : 'ghost'" @click="toggle('showAreas')">Area borders & legend</UiButton>
    <UiButton :variant="store.toggles.showMajorStarts ? 'selected' : 'ghost'" @click="toggle('showMajorStarts')">Major starts</UiButton>
    <UiButton :variant="store.toggles.showFreshSalt ? 'selected' : 'ghost'" @click="toggle('showFreshSalt')">Fresh/Salt</UiButton>
    <UiButton :variant="store.toggles.showElevation ? 'selected' : 'ghost'" @click="toggle('showElevation')">
      <span class="inline-flex items-center gap-1">
        <UiIcon :icon="objStore.getTypeObject('elevationType:flat').icon" class="w-4 h-4"/>
        Elevation
      </span>
    </UiButton>
    <UiButton :variant="store.toggles.showFeatures ? 'selected' : 'ghost'" @click="toggle('showFeatures')">
      <span class="inline-flex items-center gap-1">
        <UiIcon :icon="objStore.getTypeObject('conceptType:feature').icon" class="w-4 h-4"/>
        Features
      </span>
    </UiButton>
  </div>
  
</template>

<style scoped>
</style>
