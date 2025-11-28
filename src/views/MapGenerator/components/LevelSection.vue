<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useMapGenStore } from '@/stores/mapGenStore'

const props = defineProps<{ variant: 'strat' | 'reg' | 'game' }>()

const store = useMapGenStore()

const iconSize = computed(() => props.variant === 'strat' ? 'w-4 h-4' : 'w-3.5 h-3.5')

const size = computed(() => {
  switch (props.variant) {
    case 'strat':
      return store.stratSize
    case 'reg':
      return store.regSize
    case 'game':
      return store.gameSize
    default:
      return store.stratSize
  }
})

const tiles = computed(() => {
  switch (props.variant) {
    case 'strat':
      return store.renderTiles.strat
    case 'reg':
      return store.renderTiles.reg
    case 'game':
      return store.renderTiles.game
    default:
      return store.renderTiles.strat
  }
})

</script>

<template>
  <section class="mx-auto w-full max-w-full min-w-[72rem] select-none">
    <div class="inline-grid" :style="{ gridTemplateColumns: `repeat(${size.x}, 24px)` }">
      <div v-for="(row, y) of tiles" :key="'row-'+variant+'-'+y" class="contents">
        <div v-for="(tile, x) of row" :key="'t-'+variant+'-'+x+'-'+y"
             class="w-[24px] h-[24px] relative border"
             :style="({
               backgroundColor: store.toggles.showTerrain ? store.terrainColor(tile) : 'transparent',
               borderColor: store.toggles.showAreas ? store.areaColors[tile.area.key] : 'transparent'
             })"
        >
          <span v-if="store.toggles.showAreaInitials"
                class="absolute inset-0 text-[12px] leading-[24px] text-white text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            {{ store.tileAreaInitials(tile) }}
          </span>
          <span v-if="store.toggles.showMajorStarts && tile.isStart"
                class="absolute inset-0 text-[18px] font-bold leading-[18px] text-black text-center border-white border-2 rounded-full">X</span>
          <span v-if="store.toggles.showFreshSalt && (tile.isSalt || tile.isFresh)"
                class="absolute top-0.5 left-0.5 text-[10px] font-bold leading-none px-1 py-0.5 rounded bg-black/50 text-white border border-white/40">
            {{ tile.isSalt ? 'S' : 'F' }}
          </span>
          <div v-if="store.toggles.showElevation && tile.elevation.id !== 'flat'"
               class="absolute inset-0 flex items-center justify-center">
            <UiIcon :icon="tile.elevation.icon" :class="iconSize + ' drop-shadow'"/>
          </div>
          <div v-if="store.toggles.showFeatures && tile.feature"
               class="absolute inset-0 flex items-center justify-center">
            <UiIcon :icon="tile.feature.icon" :class="iconSize + ' drop-shadow'"/>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
