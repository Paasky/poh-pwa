<script setup lang="ts">
import UiYield from '@/components/Ui/UiYield.vue'
import { Yield } from '@/types/common'
import { computed } from 'vue'

const props = defineProps<{
  yields: Yield[],
  hideName?: boolean
  asTotal?: boolean
}>()
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

function onClick (ev: MouseEvent) {
  emit('click', ev)
}

const yieldsData = computed(() => {
  if (!props.asTotal) return props.yields

  const merged: Record<string, Yield> = {}

  for (const yieldData of props.yields) {
    let key = yieldData.type + ':' + yieldData.method
    if (yieldData.for.length) {
      for (const yieldFor in yieldData.for) {
        let forKey = key + ':for:' + yieldFor

        if (merged[forKey]) {
          merged[key].amount += yieldData.amount
        } else {
          merged[key] = { ...yieldData }
        }
      }
    }
    if (yieldData.vs.length) {
      for (const yieldVs in yieldData.vs) {
        let vsKey = key + ':vs:' + yieldVs

        if (merged[vsKey]) {
          merged[key].amount += yieldData.amount
        } else {
          merged[key] = { ...yieldData }
        }
      }
    }

    if (yieldData.for.length || yieldData.vs.length) continue

    if (merged[key]) {
      merged[key].amount += yieldData.amount
    } else {
      merged[key] = { ...yieldData }
    }
  }

  // Merge any percent amounts directly affecting lump amounts
  for (const [key, yieldData] of Object.entries(merged)) {
    if (yieldData.method === 'percent' && yieldData.for.length + yieldData.vs.length === 0) {
      const lumpKey = yieldData.type + ':lump'
      if (merged[lumpKey]) {
        // Round to closest 0.1
        merged[lumpKey].amount = Math.round(merged[lumpKey].amount * (1 + yieldData.amount / 100))
        delete merged[key]
      }
    }
  }

  return Object.keys(merged)
      .sort()
      .map(key => merged[key])
})
</script>

<template>
  <p v-for="data in yieldsData" :key="JSON.stringify(data)" class="mb-1">
    <UiYield :data="data" :hide-name="hideName" :no-lump-plus="true"/>
  </p>
</template>
