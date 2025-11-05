<script setup lang="ts">
import { computed } from 'vue'
import UiCard from '@/components/Ui/UiCard.vue'
import { usePlayerScienceStore } from '@/components/PlayerDetails/Tabs/scienceStore'
import UiTypePill from '@/components/Ui/UiTypePill.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import UiTypePillList from '@/components/Ui/UiTypePillList.vue'
import ScienceTabArrows from '@/components/PlayerDetails/Tabs/ScienceTabArrows.vue'
import UiHeader from '@/components/Ui/UiHeader.vue'

const science = usePlayerScienceStore()
const maxY = Math.max(...science.techs.map(t => t.y))
const maxX = Math.max(...science.techs.map(t => t.x))

// Base size controls (rem units)
const xSize = 5.5
const ySize = 7

const cardWidthRem = xSize * (20 / xSize)
const cardHeightRem = ySize * (10 / ySize)
const containerWidthRem = computed(() => maxX * xSize + cardWidthRem)
const containerHeightRem = computed(() => (maxY + 1.6) * ySize)
</script>

<template>
  <div class="mt-28 m-4 relative text-sm"
       :style="{ height: `${containerHeightRem}rem`, width: `${containerWidthRem}rem` }">
    <!-- connector lines -->
    <ScienceTabArrows
        stroke-color-rgb="rgb(48, 48, 48)"
        :container-width-rem="containerWidthRem"
        :container-height-rem="containerHeightRem"
        :x-size="xSize"
        :y-size="ySize"
        :card-width-rem="cardWidthRem"
        :card-height-rem="cardHeightRem"
    />

    <UiHeader v-for="(era, i) of science.eras"
              class="absolute"
              :class="i > 0 ? 'border-t border-yellow-800/75' : ''"
              :style="{
                 top: i > 0 ? `${(era.y - 1.125) * ySize}rem` : `${(era.y - 1) * ySize}rem`,
                 left: '-1rem',
                 width: `${containerWidthRem+2.8}rem`
               }"
              :title="`${era.era.name} Era`"
              :type-object="{ key: era.era.key }"
    />

    <UiCard v-for="tech of science.techs"
            class="absolute border-4 select-none"
            :class="{
              'cursor-pointer': !tech.isResearched && !tech.isResearching,
            }"
            :bg-color="tech.isResearching ? 'bg-blue-900 animate-pulse' : (tech.canResearch ? 'bg-blue-950' : undefined)"
            :style="{ left: `${tech.x * xSize}rem`, top: `${tech.y * ySize}rem`, width: `${cardWidthRem}rem`, height: `${cardHeightRem}rem` }"
            :selected="tech.queuePos !== null"
            :disabled="!tech.canResearch && !tech.isResearched"
            @click="() => {tech.isResearched ? null : science.start(tech.type)}"
    >
      <div class="border-b border-white/20 pb-1 mb-2">
        <UiTypePill :objOrKey="tech.type" :hide-icon="true"/>
        <span v-if="tech.queuePos !== null">({{ tech.queuePos + 1 }})</span>
        <span class="float-right">
          <UiIcon :icon="tech.type.icon"/>
          <span v-if="tech.isResearching || tech.researched">{{ tech.researched }}/</span>{{ tech.cost }}
        </span>
      </div>
      <div class="text-xs flex flex-wrap items-start content-start gap-x-1 overflow-y-auto"
           :style="{ height: `${ySize}rem` }">
        <UiTypePillList :type-keys="tech.type.allows.filter(t => !t.startsWith('technologyType:'))" :no-margin="true"
                        :short-name="tech.type.allows.length > 6"/>
      </div>
    </UiCard>
  </div>
</template>
