<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useObjectsStore } from '@/stores/objectStore'
import type { WorldSize } from '@/factories/worldFactory'
import { Tile } from '@/objects/gameObjects'
import { TerraGenerator } from '@/factories/TerraGenerator/terraGenerator'
import UiButton from '@/components/Ui/UiButton.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'

type Toggles = {
  showAreaInitials: boolean
  showAreas: boolean
  showMajorStarts: boolean
  showTerrainColors: boolean
  showElevation: boolean
  showFeatures: boolean
}

const objects = useObjectsStore()

// Defaults from example()
const defaults: WorldSize = {
  name: 'Terra',
  x: 28 * 9,
  y: 14 * 9,
  continents: 10,
  majorsPerContinent: 4,
  minorsPerPlayer: 2,
  seaLevel: 2,
}

const form = reactive<WorldSize>({ ...defaults })
const toggles = reactive<Toggles>({
  showAreaInitials: false,
  showAreas: false,
  showMajorStarts: true,
  showTerrainColors: true,
  showElevation: false,
  showFeatures: true,
})

const gen = ref<TerraGenerator | null>(null)

// Ensure static types are loaded for the generator
async function ensureTypesReady () {
  // If already initialized (via Game route), do nothing
  if ((objects as any).ready) return
  // If static types present, skip
  if (Object.keys((objects as any)._staticObjects ?? {}).length > 0) return
  const res = await fetch('/staticData.json', { cache: 'no-store' })
  const staticData = await res.json()
  objects.initStatic(staticData)
}

onMounted(async () => {
  await ensureTypesReady()
  generate()
})

function generate () {
  gen.value = new TerraGenerator({ ...form }).generateStratLevel().generateRegLevel()
}

const stratSize = computed(() => gen.value?.stratSize ?? { x: 0, y: 0 })
const regSize = computed(() => gen.value?.regSize ?? { x: 0, y: 0 })

function getStratTile (x: number, y: number) {
  return gen.value!.stratTiles[Tile.getKey(x, y)]
}

function getRegTile (x: number, y: number) {
  return gen.value!.regTiles[Tile.getKey(x, y)]
}

// Area legend/colors
const areaKeys = computed(() => {
  if (!gen.value) return [] as string[]
  const keys = new Set<string>()
  for (const t of Object.values(gen.value.stratTiles)) keys.add(t.area.key)
  for (const t of Object.values(gen.value.regTiles)) keys.add(t.area.key)
  return Array.from(keys)
})

function hashStr (s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0)
}

function areaBorderColor (areaKey: string, isOcean: boolean): string {
  // Generate hues using the golden‑angle method to maximize perceived distinctness
  // while keeping saturation/lightness moderate so borders don't overpower terrain fills.
  const GOLDEN_ANGLE = 137.508
  const base = hashStr(areaKey)
  const h = (base * GOLDEN_ANGLE) % 360

  // Slightly higher saturation than before for clearer separation, but still muted.
  // Oceans: a touch darker and a bit less saturated than continents.
  const sat = isOcean ? 30 : 40
  const light = isOcean ? 35 : 55

  // Use HSL (space-separated syntax) to avoid matching fixed HEX terrain colors.
  return `hsl(${h} ${sat}% ${light}%)`
}

const areaLegend = computed(() => {
  if (!gen.value) return [] as { key: string, name: string, color: string }[]
  return areaKeys.value.map(key => {
    const area = objects.getTypeObject(key as any)
    const isOcean = area.class === 'oceanType'
    return { key, name: area.name, color: areaBorderColor(key, isOcean) }
  })
})

// Background color from terrain id
function terrainColor (tile: Tile): string {
  // Common ids first
  switch (tile.terrain.id) {
    case 'ocean':
      return '#172554' // blue-950
    case 'sea':
      return '#1e3a8a' // blue-900
    case 'coast':
      return '#1e3a8a' //
    case 'lake':
      return '#164e63' // cyan-900
    case 'river':
      return '#1e3a8a' // blue-900
    case 'grass':
      return tile.climate.id === 'equatorial'
          ? '#094200' // custom
          : '#3f6212' // lime-800
    case 'plains':
      return '#ca8a04' // yellow-600
    case 'desert':
      return '#facc15' // yellow-400
    case 'tundra':
      return '#3e5234' // custom
    case 'snow':
      return '#e5e7eb' // gray-200
  }
  // Fallback deterministic
  const h = hashStr(tile.terrain.id) % 360
  return `hsl(${h} 50% 50%)`
}

const tileKeysWithStart = computed(() => ({
  strat: Object.values(gen.value?.continents ?? {}).flatMap(c => c.majorStarts.strat.map(t => t.key)),
  reg: Object.values(gen.value?.continents ?? {}).flatMap(c => c.majorStarts.reg.map(t => t.key)),
  game: Object.values(gen.value?.continents ?? {}).flatMap(c => c.majorStarts.game.map(t => t.key))
}))

function tileAreaInitials (tile: Tile): string {
  const id: string = tile.area.id
  return tile.domain.id === 'land' ? id.slice(0, 2).toUpperCase() : id.slice(0, 2).toLowerCase()
}

const selectedLevel = ref<'strat' | 'reg'>('reg')

</script>

<template>
  <div class="w-screen h-screen overflow-auto bg-gray-900 text-slate-100">
    <div class="w-full p-4 space-y-6">
      <h1 class="text-3xl font-semibold">Map Generator</h1>
      <div v-if="!gen" class="text-center text-lg opacity-50 animate-pulse">
        Loading...
      </div>
      <div v-else>
        <!-- Controls -->
        <form
            class="mx-auto w-full max-w-full min-w-[72rem] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 items-end">
          <label class="block">
            <span class="text-sm text-slate-300">Width (x)</span>
            <input v-model.number="form.x" type="number" min="9" step="9"
                   class="w-full mt-1 px-2 py-1 rounded bg-gray-800 border border-gray-700"/>
          </label>
          <label class="block">
            <span class="text-sm text-slate-300">Height (y)</span>
            <input v-model.number="form.y" type="number" min="9" step="9"
                   class="w-full mt-1 px-2 py-1 rounded bg-gray-800 border border-gray-700"/>
          </label>
          <label class="block">
            <span class="text-sm text-slate-300">Continents</span>
            <input v-model.number="form.continents" type="number" min="1" max="10"
                   class="w-full mt-1 px-2 py-1 rounded bg-gray-800 border border-gray-700"/>
          </label>
          <label class="block">
            <span class="text-sm text-slate-300">Majors / Continent</span>
            <input v-model.number="form.majorsPerContinent" type="number" min="1" max="4"
                   class="w-full mt-1 px-2 py-1 rounded bg-gray-800 border border-gray-700"/>
          </label>
          <label class="block">
            <span class="text-sm text-slate-300">Minors / Player</span>
            <input v-model.number="form.minorsPerPlayer" type="number" min="0" max="2"
                   class="w-full mt-1 px-2 py-1 rounded bg-gray-800 border border-gray-700"/>
          </label>
          <label class="block">
            <span class="text-sm text-slate-300">Sea Level</span>
            <input v-model.number="form.seaLevel" type="number" min="1" max="3"
                   class="w-full mt-1 px-2 py-1 rounded bg-gray-800 border border-gray-700"/>
          </label>
          <div class="col-span-2 sm:col-span-3 md:col-span-6 flex flex-wrap items-center gap-4">
            <button type="button" @click="generate"
                    class="px-4 py-2 rounded bg-sky-500 text-slate-900 hover:bg-sky-400">
              Generate
            </button>
            <label class="inline-flex items-center gap-2"><input v-model="toggles.showTerrainColors" type="checkbox"
                                                                 class="accent-sky-500"/>
              <span>Terrain colors</span></label>
            <label class="inline-flex items-center gap-2"><input v-model="toggles.showAreaInitials" type="checkbox"
                                                                 class="accent-sky-500"/>
              <span>Area initials</span></label>
            <label class="inline-flex items-center gap-2"><input v-model="toggles.showAreas" type="checkbox"
                                                                 class="accent-sky-500"/>
              <span>Area borders & legend</span></label>
            <label class="inline-flex items-center gap-2"><input v-model="toggles.showMajorStarts" type="checkbox"
                                                                 class="accent-sky-500"/>
              <span>Major starts</span></label>
            <label class="inline-flex items-center gap-2"><input v-model="toggles.showElevation" type="checkbox"
                                                                 class="accent-sky-500"/>
              <span class="inline-flex items-center gap-1">
                <UiIcon :icon="objects.getTypeObject('elevationType:flat').icon" class="w-4 h-4"/>
                Elevation
              </span>
            </label>
            <label class="inline-flex items-center gap-2"><input v-model="toggles.showFeatures" type="checkbox"
                                                                 class="accent-sky-500"/>
              <span class="inline-flex items-center gap-1">
                <UiIcon :icon="objects.getTypeObject('conceptType:feature').icon" class="w-4 h-4"/>
                Features
              </span>
            </label>
          </div>
        </form>

        <!-- Legend for Areas -->
        <div v-if="areaLegend.length" class="mx-auto w-full max-w-full min-w-[72rem] bg-gray-800 rounded p-3">
          <h2 class="text-lg mb-2">Areas</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <div v-for="a in areaLegend" :key="a.key" class="flex items-center gap-2">
            <span class="inline-block w-5 h-5 rounded border"
                  :style="{ backgroundColor: 'transparent', borderColor: a.color }"></span>
              <span class="text-slate-200 text-sm">{{ a.name }}</span>
            </div>
          </div>
        </div>

        <!-- LEVEL TOGGLES -->
        <div class="mx-auto w-full max-w-full min-w-[72rem] mt-2 flex items-center gap-2">
          <UiButton :variant="selectedLevel === 'strat' ? 'selected' : 'ghost'" @click="selectedLevel = 'strat'">
            Strategic
          </UiButton>
          <UiButton :variant="selectedLevel === 'reg' ? 'selected' : 'ghost'" @click="selectedLevel = 'reg'">Region
          </UiButton>
        </div>

        <!-- STRATEGIC LEVEL -->
        <section v-show="selectedLevel === 'strat'" class="mx-auto w-full max-w-full min-w-[72rem] select-none">
          <div class="">
            <div
                class="inline-grid"
                :style="{ gridTemplateColumns: `repeat(${stratSize.x}, 24px)` }"
            >
              <div v-for="y in stratSize.y" :key="'srow'+y" class="contents">
                <div v-for="x in stratSize.x" :key="'st'+x+'-'+y"
                     class="w-[24px] h-[24px] relative border"
                     :style="({
                     backgroundColor: toggles.showTerrainColors ? terrainColor(getStratTile(x-1,y-1)) : 'transparent',
                     borderColor: toggles.showAreas ? areaBorderColor(getStratTile(x-1,y-1).area.key || 'none', (getStratTile(x-1,y-1).area.class === 'oceanType')) : 'transparent'
                   })"
                >
                  <span v-if="toggles.showAreaInitials"
                        class="absolute inset-0 text-[12px] leading-[24px] text-white text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {{ tileAreaInitials(getStratTile(x - 1, y - 1)) }}
                  </span>
                  <span v-if="toggles.showMajorStarts && tileKeysWithStart.strat.includes(Tile.getKey(x-1,y-1))"
                        class="absolute inset-0 text-[18px] font-bold leading-[18px] text-black text-center border-white border-2 rounded-full"
                  >X</span>
                  <div v-if="toggles.showElevation && getStratTile(x-1,y-1).elevation.id !== 'flat'"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="getStratTile(x-1,y-1).elevation.icon" class="w-4 h-4 drop-shadow"/>
                  </div>
                  <div v-if="toggles.showFeatures && getStratTile(x-1,y-1).feature"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="getStratTile(x-1,y-1).feature.icon" class="w-4 h-4 drop-shadow"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- REGION LEVEL -->
        <section v-show="selectedLevel === 'reg'" class="mx-auto w-full max-w-full min-w-[72rem] select-none">
          <div class="">
            <div
                class="inline-grid"
                :style="{ gridTemplateColumns: `repeat(${regSize.x}, 24px)` }"
            >
              <div v-for="y in regSize.y" :key="'rrow'+y" class="contents">
                <div v-for="x in regSize.x" :key="'rt'+x+'-'+y"
                     class="w-[24px] h-[24px] relative border"
                     :style="({
                     backgroundColor: toggles.showTerrainColors ? terrainColor(getRegTile(x-1,y-1)) : 'transparent',
                     borderColor: toggles.showAreas ? areaBorderColor(getRegTile(x-1,y-1).area.key || 'none', (getRegTile(x-1,y-1).area.class === 'oceanType')) : 'transparent'
                   })"
                >
                  <span v-if="toggles.showAreaInitials"
                        class="absolute inset-0 text-[12px] leading-[24px] text-white text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {{ getRegTile(x - 1, y - 1) ? tileAreaInitials(getRegTile(x - 1, y - 1)) : '' }}
                  </span>
                  <div v-if="toggles.showElevation && getRegTile(x-1,y-1).elevation.id !== 'flat'"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="getRegTile(x-1,y-1).elevation.icon" class="w-3.5 h-3.5 drop-shadow"/>
                  </div>
                  <div v-if="toggles.showFeatures && getRegTile(x-1,y-1).feature"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="getRegTile(x-1,y-1).feature.icon" class="w-3.5 h-3.5 drop-shadow"/>
                  </div>
                  <span v-if="toggles.showMajorStarts && tileKeysWithStart.reg.includes(Tile.getKey(x-1,y-1))"
                        class="absolute inset-0 text-[18px] font-bold leading-[18px] text-black text-center border-white border-2 rounded-full"
                  >X</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
