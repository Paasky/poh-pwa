<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useObjectsStore } from '@/stores/objectStore'
import type { WorldSize } from '@/factories/worldFactory'
import { worldSizes } from '@/factories/worldFactory'
import { TerraGenerator } from '@/factories/TerraGenerator/terraGenerator'
import UiButton from '@/components/Ui/UiButton.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import UiDropdown from '@/components/Ui/UiDropdown.vue'
import { WorldManager } from '@/managers/worldManager'
import { StaticData } from '@/types/api'
import { Tile } from '@/objects/gameObjects'
import { takeRandom } from '@/helpers/arrayTools'

const objStore = useObjectsStore()
const worldConfig = WorldManager.mapConfig()
const gen = ref<TerraGenerator | null>(null)

// Ensure static types are loaded for the generator
async function ensureTypesReady () {
  // If already initialized (via Game route), do nothing
  if (objStore.ready) return

  const res = (await fetch('/staticData.json', { cache: 'no-store' }))
  const staticData: StaticData = await res.json()
  objStore.initStatic(staticData)
}

onMounted(async () => {
  await ensureTypesReady()
  generate()
})

// Row 1: World Options
const worldValues = ref<WorldSize>({
  name: 'Terra',

  // Size
  x: 28 * 9,
  y: 14 * 9,

  // Count-dropdowns
  continents: 10,
  majorsPerContinent: 4,
  minorsPerPlayer: 2,
  seaLevel: 2,
})

// 1.1) Size-dropdown options: from Tiny (36) to Huge (132); new opt every 9*y; x = 2*y
const sizeOptions = computed(() => {
  const ys = worldSizes.map(ws => ws.y)
  const minY = Math.min(...ys) // typically 36
  const maxY = Math.max(...ys) // typically 132

  // Build dropdown options
  const opts: { label: string, value: { x: number, y: number } }[] = []
  const presetByY = Object.fromEntries(worldSizes.map(ws => [ws.y, ws])) as Record<number, WorldSize>
  for (let y = minY; y <= maxY; y += 9) {
    const x = y * 2
    const preset = presetByY[y]
    const label = preset ? `${preset.name} (${x}×${y})` : `${x}×${y}`
    opts.push({ label, value: { x, y } })
  }
  return opts
})

// 1.2) Memory usage info under Size (depends on continents/majors/minors)
const memInfo = computed(() => {
  const { minMB, maxMB, cpuImpact } = worldConfig.getMemReq(
      worldValues.value.continents,
      worldValues.value.majorsPerContinent,
      worldValues.value.minorsPerPlayer,
  )
  const cpuLabels = ['tiny', 'low', 'some', 'medium', 'high'] as const
  const cpu = cpuLabels[cpuImpact - 1]
  return { minMB, maxMB, cpu }
})

// 1.3) Count-dropdowns options
const continentsOptions = [
  { label: '10', value: 10 },
  { label: '9', value: 9 },
  { label: '8', value: 8 },
  { label: '7', value: 7 },
  { label: '6', value: 6 },
  { label: '5', value: 5 },
  { label: '4', value: 4 },
] // todo: from worldConfig min-max
const majorsOptions = [
  { label: '4', value: 4 },
  { label: '3', value: 3 },
  { label: '2', value: 2 },
  { label: '1', value: 1 },
] // todo: from worldConfig min-max
const minorsOptions = [
  { label: '2', value: 2 },
  { label: '1', value: 1 },
  { label: '0', value: 0 },
] // todo: from worldConfig min-max
const seaLevelOptions = [
  { label: 'Low', value: 1 },
  { label: 'Normal', value: 2 },
  { label: 'High', value: 3 },
]

// 1.4) Alignment dropdown options
const alignmentOptions = [
  { label: 'Earth-like', value: { mirrorX: false, mirrorY: false, mirrorClimate: false } },
  { label: 'Mirror Latitude', value: { mirrorX: false, mirrorY: true, mirrorClimate: true } },
  { label: 'Mirror Longitude', value: { mirrorX: true, mirrorY: false, mirrorClimate: false } },
  { label: 'Mirror Both', value: { mirrorX: true, mirrorY: true, mirrorClimate: true } },
  { label: 'Random', value: { mirrorX: null, mirrorY: null, mirrorClimate: null } },
]
// Store only the value object in the v-model to match UiDropdown's emitted value
const alignment = ref<{
  mirrorX: boolean | null,
  mirrorY: boolean | null,
  mirrorClimate: boolean | null
}>(alignmentOptions[0].value)

// Row 2: Preview Toggles
const toggles = reactive({
  showLegends: false,
  showTerrain: true,
  showElevation: true,
  showFeatures: true,
  showMajorStarts: true,
  showAreas: false,
  showAreaInitials: false,
})

function generate () {
  gen.value = new TerraGenerator(
      worldValues.value,
      alignment.value.mirrorX === null ? Math.random() < 0.5 : alignment.value.mirrorX,
      alignment.value.mirrorY === null ? Math.random() < 0.5 : alignment.value.mirrorY,
      alignment.value.mirrorClimate === null ? Math.random() < 0.5 : alignment.value.mirrorClimate,
  )
      .generateStratLevel()
      .generateRegLevel()
}

const renderTiles = computed(() => {
  const out = {
    strat: [] as Tile[][],
    reg: [] as Tile[][],
    game: [] as Tile[][],
  }
  for (const stratTile of Object.values(gen.value!.stratTiles)) {
    const x = stratTile.x
    const y = stratTile.y
    out.strat[y] = out.strat[y] || []
    out.strat[y][x] = stratTile
  }
  for (const regTile of Object.values(gen.value!.regTiles)) {
    const x = regTile.x
    const y = regTile.y
    out.reg[y] = out.reg[y] || []
    out.reg[y][x] = regTile
  }
  for (const gameTile of Object.values(gen.value!.gameTiles)) {
    const x = gameTile.x
    const y = gameTile.y
    out.game[y] = out.game[y] || []
    out.game[y][x] = gameTile
  }
  return out
})

// Unique Areas
const areaKeys = computed(() => {
  if (!gen.value) return [] as string[]
  const keys = new Set<string>()
  for (const t of Object.values(gen.value.stratTiles)) keys.add(t.area.key)
  for (const t of Object.values(gen.value.regTiles)) keys.add(t.area.key)
  return Array.from(keys)
})

// Semi-random area borders
const CONTINENT_COLORS = [
  'hsl(285 65% 70%)',
  'hsl(330 80% 60%)',
  'hsl(0 90% 55%)',
  'hsl(25 90% 55%)',
  'hsl(35 90% 55%)',
  'hsl(45 90% 55%)',
  'hsl(55 90% 55%)',
  'hsl(70 85% 50%)',
  'hsl(85 75% 48%)',
  'hsl(100 70% 45%)',
]
const OCEAN_COLORS = [
  'hsl(190 80% 60%)',
  'hsl(200 75% 65%)',
  'hsl(220 75% 65%)',
  'hsl(230 80% 62%)',
  'hsl(240 85% 60%)',
  'hsl(255 80% 62%)',
  'hsl(265 75% 65%)',
]
const areaColors = {} as Record<string, string>

const areaLegend = computed(() => {
  return areaKeys.value
      .map(key => {
        const area = objStore.getTypeObject(key as any)
        const isOcean = area.class === 'oceanType'
        if (!areaColors[area.key]) {
          areaColors[area.key] = isOcean ? takeRandom(OCEAN_COLORS) : takeRandom(CONTINENT_COLORS)
        }
        const color = areaColors[area.key]
        return { key, name: area.name, color }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
})
const continentsLegend = computed(() => areaLegend.value
    .filter(a => objStore.getTypeObject(a.key as any).class === 'continentType')
    .sort((a, b) => a.name.localeCompare(b.name)))
const oceansLegend = computed(() => areaLegend.value
    .filter(a => objStore.getTypeObject(a.key as any).class === 'oceanType')
    .sort((a, b) => a.name.localeCompare(b.name)))

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
      return '#575310' // custom
    case 'desert':
      return '#b8b83b' // yellow-400
    case 'tundra':
      return '#3e5234' // custom
    case 'snow':
      return '#e5e7eb' // gray-200
  }
  return `hsl(50% 50% 50%)`
}

// Tiles that have a major player starting location
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

// Always-visible legends for Terrain, Elevation, Features
const terrainTypes = computed(() => [...objStore.getClassTypes('terrainType')].sort((a, b) => a.name.localeCompare(b.name)))
const elevationTypes = computed(() => [...objStore.getClassTypes('elevationType')]
    .filter(e => e.id !== 'flat')
    .sort((a, b) => a.name.localeCompare(b.name)))
const featureTypes = computed(() => [...objStore.getClassTypes('featureType')].sort((a, b) => a.name.localeCompare(b.name)))

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
        <div class="mx-auto w-full max-w-full min-w-[72rem] flex flex-wrap items-start gap-3">
          <div class="min-w-[14rem]">
            <UiDropdown
                :options="sizeOptions"
                :model-value="{ x: worldValues.x, y: worldValues.y }"
                label="Size"
                @update:modelValue="(v: any) => {
                worldValues.x = v.x; worldValues.y = v.y;
                // Set other params from the nearest preset size
                const nearest = [...worldSizes].sort((a,b)=> Math.abs(a.y - v.y) - Math.abs(b.y - v.y))[0]
                if (nearest) {
                  worldValues.continents = nearest.continents
                  worldValues.majorsPerContinent = nearest.majorsPerContinent
                  worldValues.minorsPerPlayer = nearest.minorsPerPlayer
                }
              }"
            />
            <div class="text-xs text-slate-400 mt-1">
              Est. memory {{ memInfo.minMB }}–{{ memInfo.maxMB }} MB • CPU {{ memInfo.cpu }}
            </div>
          </div>
          <UiDropdown label="Continents" v-model="worldValues.continents as any" :options="continentsOptions"/>
          <UiDropdown label="Majors / Continent" v-model="worldValues.majorsPerContinent as any"
                      :options="majorsOptions"/>
          <UiDropdown label="Minors / Player" v-model="worldValues.minorsPerPlayer as any" :options="minorsOptions"/>
          <UiDropdown label="Sea Level" v-model="worldValues.seaLevel as any" :options="seaLevelOptions"/>
          <UiDropdown label="Alignment" v-model="alignment as any" :options="alignmentOptions as any"/>

          <UiButton @click.prevent="generate">Generate</UiButton>
        </div>

        <!-- VIEW FILTERS (above legends) as toggle buttons -->
        <div class="mx-auto w-full max-w-full min-w-[72rem] mt-2 flex flex-wrap items-center gap-2">
          <UiButton :variant="toggles.showLegends ? 'selected' : 'ghost'"
                    @click="toggles.showLegends = !toggles.showLegends">Show legends
          </UiButton>
          <UiButton :variant="toggles.showTerrain ? 'selected' : 'ghost'"
                    @click="toggles.showTerrain = !toggles.showTerrain">Terrain colors
          </UiButton>
          <UiButton :variant="toggles.showAreaInitials ? 'selected' : 'ghost'"
                    @click="toggles.showAreaInitials = !toggles.showAreaInitials">Area initials
          </UiButton>
          <UiButton :variant="toggles.showAreas ? 'selected' : 'ghost'" @click="toggles.showAreas = !toggles.showAreas">
            Area borders & legend
          </UiButton>
          <UiButton :variant="toggles.showMajorStarts ? 'selected' : 'ghost'"
                    @click="toggles.showMajorStarts = !toggles.showMajorStarts">Major starts
          </UiButton>
          <UiButton :variant="toggles.showElevation ? 'selected' : 'ghost'"
                    @click="toggles.showElevation = !toggles.showElevation">
            <span class="inline-flex items-center gap-1">
              <UiIcon :icon="objStore.getTypeObject('elevationType:flat').icon" class="w-4 h-4"/>
              Elevation
            </span>
          </UiButton>
          <UiButton :variant="toggles.showFeatures ? 'selected' : 'ghost'"
                    @click="toggles.showFeatures = !toggles.showFeatures">
            <span class="inline-flex items-center gap-1">
              <UiIcon :icon="objStore.getTypeObject('conceptType:feature').icon" class="w-4 h-4"/>
              Features
            </span>
          </UiButton>
        </div>

        <!-- Legends: Areas split and always-visible type legends (toggleable) -->
        <div v-if="toggles.showLegends" class="mx-auto w-full max-w-full min-w-[72rem] flex flex-col gap-3">
          <div v-if="areaLegend.length" class="flex flex-wrap gap-3">
            <div class="bg-gray-800 rounded p-3 flex flex-col gap-2">
              <h2 class="text-lg mb-2">Continents</h2>
              <div class="flex flex-wrap gap-2">
                <div v-for="a in continentsLegend" :key="'cont-'+a.key" class="flex items-center gap-2">
                  <span class="inline-block w-5 h-5 rounded border" :style="{ borderColor: a.color }"></span>
                  <span class="text-slate-200 text-sm">{{ a.name }}</span>
                </div>
              </div>
            </div>
            <div class="bg-gray-800 rounded p-3 flex flex-col gap-2">
              <h2 class="text-lg mb-2">Oceans</h2>
              <div class="flex flex-wrap gap-2">
                <div v-for="a in oceansLegend" :key="'ocean-'+a.key" class="flex items-center gap-2">
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
                <div v-for="t in terrainTypes" :key="t.key" class="flex items-center gap-2">
                  <span class="inline-block w-5 h-5 rounded-sm border border-gray-700"
                        :style="{ backgroundColor: terrainColor({terrain: t, climate:{id:'temperate'}} as Tile) }"></span>
                  <span class="text-slate-200 text-sm">{{ t.name }}</span>
                </div>
              </div>
            </div>
            <div class="bg-gray-800 rounded p-3 flex flex-col gap-2">
              <h2 class="text-lg mb-2">Elevation</h2>
              <div class="flex flex-wrap gap-2">
                <div v-for="e in elevationTypes" :key="e.key" class="flex items-center gap-2">
                  <UiIcon :icon="e.icon" class="w-4 h-4"/>
                  <span class="text-slate-200 text-sm">{{ e.name }}</span>
                </div>
              </div>
            </div>
            <div class="bg-gray-800 rounded p-3 flex flex-col gap-2">
              <h2 class="text-lg mb-2">Features</h2>
              <div class="flex flex-wrap gap-2">
                <div v-for="f in featureTypes" :key="f.key" class="flex items-center gap-2">
                  <UiIcon :icon="f.icon" class="w-4 h-4"/>
                  <span class="text-slate-200 text-sm">{{ f.name }}</span>
                </div>
              </div>
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
                :style="{ gridTemplateColumns: `repeat(${gen.stratSize.x}, 24px)` }"
            >
              <div v-for="(row, y) of renderTiles.strat" :key="'srow'+y" class="contents">
                <div v-for="(tile, x) of row" :key="'st'+x+'-'+y"
                     class="w-[24px] h-[24px] relative border"
                     :style="({
                     backgroundColor: toggles.showTerrain ? terrainColor(tile) : 'transparent',
                     borderColor: toggles.showAreas ? areaColors[tile.area.key] : 'transparent'
                   })"
                >
                  <span v-if="toggles.showAreaInitials"
                        class="absolute inset-0 text-[12px] leading-[24px] text-white text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {{ tileAreaInitials(tile) }}
                  </span>
                  <span v-if="toggles.showMajorStarts && tileKeysWithStart.strat.includes(Tile.getKey(x-1,y-1))"
                        class="absolute inset-0 text-[18px] font-bold leading-[18px] text-black text-center border-white border-2 rounded-full"
                  >X</span>
                  <div v-if="toggles.showElevation && tile.elevation.id !== 'flat'"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="tile.elevation.icon" class="w-4 h-4 drop-shadow"/>
                  </div>
                  <div v-if="toggles.showFeatures && tile.feature"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="(tile.feature as any).icon" class="w-4 h-4 drop-shadow"/>
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
                :style="{ gridTemplateColumns: `repeat(${gen.regSize.x}, 24px)` }"
            >
              <div v-for="(row, y) of renderTiles.reg" :key="'rrow'+y" class="contents">
                <div v-for="(tile, x) of row" :key="'st'+x+'-'+y"
                     class="w-[24px] h-[24px] relative border"
                     :style="({
                     backgroundColor: toggles.showTerrain ? terrainColor(tile) : 'transparent',
                     borderColor: toggles.showAreas ? areaColors[tile.area.key] : 'transparent'
                   })"
                >
                  <span v-if="toggles.showAreaInitials"
                        class="absolute inset-0 text-[12px] leading-[24px] text-white text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {{ tileAreaInitials(tile) }}
                  </span>
                  <div v-if="toggles.showElevation && tile.elevation.id !== 'flat'"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="tile.elevation.icon" class="w-3.5 h-3.5 drop-shadow"/>
                  </div>
                  <div v-if="toggles.showFeatures && tile.feature"
                       class="absolute inset-0 flex items-center justify-center">
                    <UiIcon :icon="(tile.feature as any).icon" class="w-3.5 h-3.5 drop-shadow"/>
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
