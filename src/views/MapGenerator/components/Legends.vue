<script setup lang="ts">
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useMapGenStore } from '@/stores/mapGenStore'

const store = useMapGenStore()
</script>

<template>
  <div class="mx-auto w-full max-w-full min-w-[72rem] flex flex-col gap-3">
    <div v-if="store.continentsLegend.length || store.oceansLegend.length" class="flex flex-wrap gap-3">
      <div v-if="store.continentsLegend.length" class="bg-gray-800 rounded p-3 flex flex-col gap-2">
        <h2 class="text-lg mb-2">Continents</h2>
        <div class="flex flex-wrap gap-2">
          <div v-for="a in store.continentsLegend" :key="'cont-'+a.key" class="flex items-center gap-2">
            <span class="inline-block w-5 h-5 rounded border" :style="{ borderColor: a.color }"></span>
            <span class="text-slate-200 text-sm">{{ a.name }}</span>
          </div>
        </div>
      </div>

      <div v-if="store.oceansLegend.length" class="bg-gray-800 rounded p-3 flex flex-col gap-2">
        <h2 class="text-lg mb-2">Oceans</h2>
        <div class="flex flex-wrap gap-2">
          <div v-for="a in store.oceansLegend" :key="'ocean-'+a.key" class="flex items-center gap-2">
            <span class="inline-block w-5 h-5 rounded border" :style="{ borderColor: a.color }"></span>
            <span class="text-slate-200 text-sm">{{ a.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <div class="bg-gray-800 rounded p-3 flex flex-col gap-2">
        <h2 class="text-lg mb-2">Terrain</h2>
        <div class="flex flex-wrap gap-2">
          <div v-for="t in store.terrainTypes" :key="t.key" class="flex items-center gap-2">
            <span class="inline-block w-5 h-5 rounded-sm border border-gray-700"
                  :style="{ backgroundColor: store.terrainColor({terrain: t, climate:{id:'temperate'}}) }"></span>
            <span class="text-slate-200 text-sm">{{ t.name }}</span>
          </div>
        </div>
      </div>

      <div class="bg-gray-800 rounded p-3 flex flex-col gap-2">
        <h2 class="text-lg mb-2">Elevation</h2>
        <div class="flex flex-wrap gap-2">
          <div v-for="e in store.elevationTypes" :key="e.key" class="flex items-center gap-2">
            <UiIcon :icon="e.icon" class="w-4 h-4"/>
            <span class="text-slate-200 text-sm">{{ e.name }}</span>
          </div>
        </div>
      </div>

      <div class="bg-gray-800 rounded p-3 flex flex-col gap-2">
        <h2 class="text-lg mb-2">Features</h2>
        <div class="flex flex-wrap gap-2">
          <div v-for="f in store.featureTypes" :key="f.key" class="flex items-center gap-2">
            <UiIcon :icon="f.icon" class="w-4 h-4"/>
            <span class="text-slate-200 text-sm">{{ f.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
