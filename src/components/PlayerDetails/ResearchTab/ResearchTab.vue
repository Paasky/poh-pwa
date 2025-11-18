<script setup lang="ts">
import { computed } from 'vue'
import UiCard from '@/components/Ui/UiCard.vue'
import UiObjPill from '@/components/Ui/UiObjPill.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import UiObjPillList from '@/components/Ui/UiObjPillList.vue'
import UiHeader from '@/components/Ui/UiHeader.vue'
import { useObjectsStore } from '@/stores/objectStore'
import { TypeObject } from '@/types/typeObjects'
import { CatKey } from '@/types/common'
import ResearchTabArrows from '@/components/PlayerDetails/ResearchTab/ResearchTabArrows.vue'

const objects = useObjectsStore()
const techs = objects.getClassTypes('technologyType')
const player = objects.getCurrentPlayer()
const research = player.research
const maxY = Math.max(...techs.map(t => t.y!))
const maxX = Math.max(...techs.map(t => t.x!))

// Base size controls (rem units)
const xSize = 5.5
const ySize = 7

const cardWidthRem = xSize * (20 / xSize)
const cardHeightRem = ySize * (10 / ySize)
const containerWidthRem = computed(() => maxX * xSize + cardWidthRem)
const containerHeightRem = computed(() => (maxY + 1.6) * ySize)

function eraY (era: TypeObject): number {
  // Find all techs in this era and return the lowest y among them
  const ys = techs
      .filter(t => t.category === (era.key as CatKey))
      .map(t => t.y ?? 0)

  return ys.length ? Math.min(...ys) : 0
}

function progress (tech: TypeObject) {
  return research.researching[tech.key]?.progress ?? 0
}

function start (target: TypeObject) {
  if (research.researched.includes(target)) return

  const chain: TypeObject[] = []
  collectRequired(target, chain)
  chain.push(target)

  // Deduplicate while preserving order
  const unique = Array.from(new Set(chain))

  // Sort top-to-bottom then left-to-right (fallback if y equal)
  unique.sort((a, b) => (a.y! - b.y!) || (a.x! - b.x!))

  research.current = unique[0] ?? null
  research.queue = unique

  function collectRequired (tech: TypeObject, acc: TypeObject[]): void {
    tech.requires.forEach(reqKey => {
      if (Array.isArray(reqKey)) {
        let cheapest: TypeObject | false | null = null
        reqKey.forEach(orReqKey => {
          if (cheapest === false) return
          const required = objects.getTypeObject(orReqKey)
          if (required.class !== 'technologyType' || acc.includes(required)) return
          if (research.researched.includes(required)) {
            cheapest = false
            return
          }
          if (!cheapest || required.scienceCost! - progress(required) < cheapest.scienceCost! - progress(cheapest)) {
            cheapest = required
          }
        })
        if (cheapest) {
          acc.push(cheapest)
          collectRequired(cheapest, acc)
        }
      } else {
        const required = objects.getTypeObject(reqKey)
        if (required.class !== 'technologyType' || research.researched.includes(required) || acc.includes(required)) return
        acc.push(required)
        collectRequired(required, acc)
      }
    })
  }
}
</script>

<template>
  <div class="mt-28 m-4 relative text-sm"
       :style="{ height: `${containerHeightRem}rem`, width: `${containerWidthRem}rem` }">
    <ResearchTabArrows
        stroke-color-rgb="rgb(48, 48, 48)"
        :container-width-rem="containerWidthRem"
        :container-height-rem="containerHeightRem"
        :x-size="xSize"
        :y-size="ySize"
        :card-width-rem="cardWidthRem"
        :card-height-rem="cardHeightRem"
    />

    <UiHeader v-for="(era, i) of objects.getClassTypes('eraType')"
              class="absolute"
              :class="i > 0 ? 'border-t border-yellow-800/75' : ''"
              :style="{
                 top: i > 0 ? `${(eraY(era) - 1.125) * ySize}rem` : `${(eraY(era) - 1) * ySize}rem`,
                 left: '-1rem',
                 width: `${containerWidthRem+2.8}rem`
               }"
              :title="`${era.name} Era`"
              :type-object="{ key: era.key }"
    />

    <UiCard v-for="tech of techs"
            class="absolute border-4 select-none"
            :class="{
              'cursor-pointer': !research.researched.includes(tech) && research.current !== tech,
            }"
            :bg-color="research.current === tech
              ? 'bg-blue-800'
              : (
                  research.researched.includes(tech)
                    ? 'bg-green-950'
                    : (
                        research.available.includes(tech)
                          ? 'bg-blue-950'
                          : 'bg-neutral-800'
                    )
              )"
            :style="{ left: `${tech.x! * xSize}rem`, top: `${tech.y! * ySize}rem`, width: `${cardWidthRem}rem`, height: `${cardHeightRem}rem` }"
            :selected="research.queue.indexOf(tech) >= 0"
            :disabled="research.researched.includes(tech)"
            @click="() => {research.researched.includes(tech) ? null : start(tech)}"
    >
      <div class="border-b border-white/20 pb-1 mb-2">
        <UiObjPill :objOrKey="tech" :hide-icon="true"/>
        <span v-if="research.queue.includes(tech)">({{ research.queue.indexOf(tech) + 1 }})</span>
        <span class="float-right">
          <UiIcon :icon="tech.icon"/>
          <span v-if="research.current === tech || progress(tech)">{{ progress(tech) }}/</span>{{ tech.scienceCost }}
        </span>
      </div>
      <div class="text-xs flex flex-wrap items-start content-start gap-x-1 overflow-y-auto"
           :style="{ height: `${ySize}rem` }">
        <UiObjPillList :obj-keys="tech.allows.filter(t => !t.startsWith('technologyType:'))" :no-margin="true"
                       :short-name="tech.allows.length > 6"/>
      </div>
    </UiCard>
  </div>
</template>
