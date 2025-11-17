<script setup lang="ts">
import { computed } from 'vue'
import type { TypeObject } from '@/types/typeObjects'
import { usePlayerScienceStore } from '@/components/PlayerDetails/Tabs/scienceStore'

interface TechData {
  type: TypeObject,
  x: number,
  y: number,
}

const props = defineProps<{
  strokeColorRgb: string
  // container sizes
  containerWidthRem: number
  containerHeightRem: number
  // layout sizes
  xSize: number
  ySize: number
  cardWidthRem: number
  cardHeightRem: number
}>()

// Internalized styling and geometry that aren't used by parent
const cornerSizeRem = computed(() => Math.min(props.xSize, props.ySize) * (2 / props.ySize))
const strokeOpacity = 1
const strokeWidth = 0.15

const science = usePlayerScienceStore()
const techByKey = computed(() => Object.fromEntries(science.techs.map(t => [t.type.key, t])) as Record<string, TechData>)

function pathBetween (fromKey: string, toKey: string): string | null {
  const from = techByKey.value[fromKey]
  const to = techByKey.value[toKey]
  if (!from || !to) return null

  const startX = from.x * props.xSize + props.cardWidthRem / 2
  const startY = from.y * props.ySize + props.cardHeightRem
  const endX = to.x * props.xSize + props.cardWidthRem / 2
  const endY = to.y * props.ySize

  // Straight vertical if aligned
  if (startX === endX) {
    return `M ${startX} ${startY} L ${endX} ${endY}`
  }

  // L-shaped path with rounded 90-degree corners
  const r = cornerSizeRem.value
  const midY = Math.max(startY + r, endY - r)
  const dirX = endX > startX ? 0.5 : -0.5

  // Segments with rounded corners (quadratic Bezier)
  const p1y = midY - r / 2
  const p2x = startX + dirX * r
  const p3x = endX - dirX * r
  const p4y = midY + r / 2

  return [
    `M ${startX} ${startY}`,
    `L ${startX} ${p1y}`,
    `Q ${startX} ${midY}, ${p2x} ${midY}`,
    `L ${p3x} ${midY}`,
    `Q ${endX} ${midY}, ${endX} ${p4y}`,
    `L ${endX} ${endY}`
  ].join(' ')
}

const connections = computed(() => {
  const paths: string[] = []
  for (const t of science.techs) {
    const targets = t.type.allows.filter(a => a.startsWith('technologyType:'))
    for (const targetKey of targets) {
      const d = pathBetween(t.type.key, targetKey)
      if (d) paths.push(d)
    }
  }
  return paths
})
</script>

<template>
  <svg class="absolute left-0 top-0 w-full h-full pointer-events-none"
       :viewBox="`0 0 ${containerWidthRem} ${containerHeightRem}`" preserveAspectRatio="none">
    <defs>
      <marker id="tech-arrowhead" viewBox="0 0 6 6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"
              markerUnits="strokeWidth">
        <path d="M0,0 L6,3 L0,6 Z" :fill="strokeColorRgb"/>
      </marker>
    </defs>
    <g fill="none"
       :stroke="strokeColorRgb"
       :stroke-opacity="strokeOpacity"
       :stroke-width="strokeWidth"
       stroke-linecap="round"
       stroke-linejoin="round">
      <path v-for="(d, i) in connections" :key="i" :d="d" marker-end="url(#tech-arrowhead)"/>
    </g>
  </svg>
</template>
