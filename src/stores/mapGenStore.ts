import { defineStore } from 'pinia'
import { computed, markRaw, reactive, ref, shallowRef, pauseTracking, resetTracking } from 'vue'
import type { WorldSize } from '@/factories/worldFactory'
import { worldSizes } from '@/factories/worldFactory'
import { WorldManager } from '@/managers/worldManager'
import { TerraGenerator } from '@/factories/TerraGenerator/terra-generator'
import { useObjectsStore } from '@/stores/objectStore'
import { takeRandom } from '@/helpers/arrayTools'
import { GenTile } from '@/factories/TerraGenerator/gen-tile'

export type AlignmentValue = {
  mirrorX: boolean | null
  mirrorY: boolean | null
  mirrorClimate: boolean | null
}

type Toggles = {
  showLegends: boolean
  showTerrain: boolean
  showElevation: boolean
  showFeatures: boolean
  showMajorStarts: boolean
  showFreshSalt: boolean
  showAreas: boolean
  showRivers: boolean
}

type SizeOption = { label: string, value: { x: number, y: number } }

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

export const useMapGenStore = defineStore('mapGen', () => {
  const objStore = useObjectsStore()
  const worldConfig = WorldManager.mapConfig()

  // Core state
  const worldValues = ref<WorldSize>({
    name: 'Terra',
    x: 28 * 9,
    y: 14 * 9,
    continents: 10,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
    seaLevel: 2,
  })

  const alignmentOptions: { label: string, value: AlignmentValue }[] = [
    { label: 'Earth-like', value: { mirrorX: false, mirrorY: false, mirrorClimate: false } },
    { label: 'Mirror Latitude', value: { mirrorX: false, mirrorY: true, mirrorClimate: true } },
    { label: 'Mirror Longitude', value: { mirrorX: true, mirrorY: false, mirrorClimate: false } },
    { label: 'Mirror Both', value: { mirrorX: true, mirrorY: true, mirrorClimate: true } },
    { label: 'Random', value: { mirrorX: null, mirrorY: null, mirrorClimate: null } },
  ]
  const alignment = ref<AlignmentValue>(alignmentOptions[0].value)

  const toggles = reactive<Toggles>({
    showLegends: false,
    showTerrain: true,
    showElevation: true,
    showFeatures: true,
    showMajorStarts: true,
    showFreshSalt: false,
    showAreas: false,
    showRivers: true,
  })

  const selectedLevel = ref<'strat' | 'reg' | 'game'>('strat')

  const gen = shallowRef<TerraGenerator | null>(null)

  // Options for dropdowns
  const sizeOptions = computed<SizeOption[]>(() => {
    const ys = worldSizes.map(ws => ws.y)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const opts: SizeOption[] = []
    const presetByY = Object.fromEntries(worldSizes.map(ws => [ws.y, ws])) as Record<number, WorldSize>
    for (let y = minY; y <= maxY; y += 9) {
      const x = y * 2
      const preset = presetByY[y]
      const label = preset ? `${preset.name} (${x}×${y})` : `${x}×${y}`
      opts.push({ label, value: { x, y } })
    }
    return opts
  })

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

  const continentsOptions = [
    { label: '10', value: 10 },
    { label: '9', value: 9 },
    { label: '8', value: 8 },
    { label: '7', value: 7 },
    { label: '6', value: 6 },
    { label: '5', value: 5 },
    { label: '4', value: 4 },
  ]
  const majorsOptions = [
    { label: '4', value: 4 },
    { label: '3', value: 3 },
    { label: '2', value: 2 },
    { label: '1', value: 1 },
  ]
  const minorsOptions = [
    { label: '2', value: 2 },
    { label: '1', value: 1 },
    { label: '0', value: 0 },
  ]
  const seaLevelOptions = [
    { label: 'Low', value: 1 },
    { label: 'Normal', value: 2 },
    { label: 'High', value: 3 },
  ]

  // Render helpers
  const renderTiles = computed(() => {
    const out = {
      strat: [] as GenTile[][],
      reg: [] as GenTile[][],
      game: [] as GenTile[][],
    }
    if (!gen.value) return out
    for (const t of Object.values(gen.value.stratTiles)) {
      out.strat[t.y] = out.strat[t.y] || []
      out.strat[t.y][t.x] = t
    }
    for (const t of Object.values(gen.value.regTiles)) {
      out.reg[t.y] = out.reg[t.y] || []
      out.reg[t.y][t.x] = t
    }
    for (const t of Object.values(gen.value.gameTiles)) {
      out.game[t.y] = out.game[t.y] || []
      out.game[t.y][t.x] = t
    }
    return out
  })

  const stratSize = computed(() => gen.value?.stratSize ?? { x: 0, y: 0 })
  const regSize = computed(() => gen.value?.regSize ?? { x: 0, y: 0 })
  const gameSize = computed(() => gen.value?.size ?? { x: 0, y: 0 })

  const areaColors = reactive<Record<string, string>>({})

  const areaKeys = computed(() => {
    if (!gen.value) return [] as string[]
    const keys = new Set<string>()
    for (const t of Object.values(gen.value.stratTiles)) keys.add(t.area.key)
    for (const t of Object.values(gen.value.regTiles)) keys.add(t.area.key)
    for (const t of Object.values(gen.value.gameTiles)) keys.add(t.area.key)
    return Array.from(keys)
  })

  const areaLegend = computed(() => areaKeys.value
    .map(key => {
      const area = objStore.getTypeObject(key as any)
      const isOcean = area.class === 'oceanType'
      if (!areaColors[area.key]) {
        areaColors[area.key] = isOcean ? takeRandom(OCEAN_COLORS) : takeRandom(CONTINENT_COLORS)
      }
      const color = areaColors[area.key]
      return { key, name: area.name, color }
    })
    .sort((a, b) => a.name.localeCompare(b.name)))

  const continentsLegend = computed(() => areaLegend.value
    .filter(a => (objStore.getTypeObject(a.key as any).class === 'continentType'))
    .sort((a, b) => a.name.localeCompare(b.name)))
  const oceansLegend = computed(() => areaLegend.value
    .filter(a => (objStore.getTypeObject(a.key as any).class === 'oceanType'))
    .sort((a, b) => a.name.localeCompare(b.name)))

  const terrainTypes = computed(() => [...objStore.getClassTypes('terrainType')].sort((a, b) => a.name.localeCompare(b.name)))
  const elevationTypes = computed(() => [...objStore.getClassTypes('elevationType')]
    .filter((e: any) => e.id !== 'flat')
    .sort((a, b) => a.name.localeCompare(b.name)))
  const featureTypes = computed(() => [...objStore.getClassTypes('featureType')].sort((a, b) => a.name.localeCompare(b.name)))

  function terrainColor (tile: any): string {
    switch (tile.terrain.id) {
      case 'ocean':
        return '#172554'
      case 'sea':
        return '#1e3a8a'
      case 'coast':
        return '#1e3a8a'
      case 'lake':
        return '#164e63'
      case 'river':
        return '#1e3a8a'
      case 'grass':
        return tile.climate.id === 'equatorial' ? '#094200' : '#3f6212'
      case 'plains':
        return '#575310'
      case 'desert':
        return '#b8b83b'
      case 'tundra':
        return '#3e5234'
      case 'snow':
        return '#e5e7eb'
    }
    return `hsl(50% 50% 50%)`
  }

  // Actions
  function updateWorld<K extends keyof WorldSize> (key: K, value: WorldSize[K]) {
    worldValues.value = { ...(worldValues.value as any), [key]: value } as WorldSize
  }

  function updateSize (v: { x: number, y: number }) {
    const next: WorldSize = { ...worldValues.value, x: v.x, y: v.y }
    const nearest = [...worldSizes].sort((a, b) => Math.abs(a.y - v.y) - Math.abs(b.y - v.y))[0]
    if (nearest) {
      next.continents = nearest.continents
      next.majorsPerContinent = nearest.majorsPerContinent
      next.minorsPerPlayer = nearest.minorsPerPlayer
    }
    worldValues.value = next
  }

  function setAlignment (value: AlignmentValue) {
    alignment.value = value
  }

  function toggle (key: keyof Toggles) {
    toggles[key] = !toggles[key]
  }

  function generate () {
    objStore.resetGame()

    const ax = alignment.value.mirrorX === null ? Math.random() < 0.5 : alignment.value.mirrorX
    const ay = alignment.value.mirrorY === null ? Math.random() < 0.5 : alignment.value.mirrorY
    const ac = alignment.value.mirrorClimate === null ? Math.random() < 0.5 : alignment.value.mirrorClimate
    pauseTracking()
    try {
      gen.value = markRaw(
        new TerraGenerator(worldValues.value, ax, ay, ac)
          .generateStratLevel()
          .generateRegLevel()
          .generateGameLevel()
      )
    } finally {
      resetTracking()
    }
  }

  return {
    init: () => {
      pauseTracking()
      try {
        gen.value = markRaw(new TerraGenerator(worldValues.value))
      } finally {
        resetTracking()
      }
    },
    // state
    worldValues,
    alignment,
    alignmentOptions,
    toggles,
    selectedLevel,
    gen,
    areaColors,

    // options
    sizeOptions,
    memInfo,
    continentsOptions,
    majorsOptions,
    minorsOptions,
    seaLevelOptions,

    // derived
    renderTiles,
    stratSize,
    regSize,
    gameSize,
    areaLegend,
    continentsLegend,
    oceansLegend,
    terrainTypes,
    elevationTypes,
    featureTypes,

    // helpers
    terrainColor,

    // actions
    updateWorld,
    updateSize,
    setAlignment,
    toggle,
    generate,
  }
})
