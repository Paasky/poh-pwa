<script setup lang="ts">
import { computed } from 'vue'
import UiTypePill from '@/components/Ui/UiTypePill.vue'
import { Yield } from '@/types/common'

const props = defineProps<{
  data: Yield
  hideName?: boolean
  positive?: boolean
  negative?: boolean
}>()
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

const flipEffectTypes = [
  'yieldType:damage',
  'yieldType:influenceCost',
  'yieldType:moveCost',
  'yieldType:productionCost',
  'yieldType:scienceCost'
]
const noEffectTypes = [
  'yieldType:productionCost',
]
const noPlusTypes = [
  'yieldType:intercept',
]

const amount = computed(() => {
  if (props.data.method === 'set') return 'Set to ' + props.data.amount
  const output = props.data.method === 'percent'
      ? props.data.amount + '%'
      : props.data.amount

  return props.data.method !== 'set' && props.data.amount > 0 && !noPlusTypes.includes(props.data.type)
      ? '+' + output
      : output
})

const colorClass = computed<string>(() => {
  if (props.positive) return 'text-green-400'
  if (props.negative) return 'text-red-400'

  if (props.data.method === 'lump' && noEffectTypes.includes(props.data.type)) return ''
  if (props.data.method === 'set') return 'text-green-400'

  if (flipEffectTypes.includes(props.data.type)) {
    if (props.data.amount > 0) return 'text-red-400'
    if (props.data.amount < 0) return 'text-green-400'
    return ''
  }
  if (props.data.amount > 0) return 'text-green-400'
  if (props.data.amount < 0) return 'text-red-400'
  return ''
})
</script>

<template>
  <span class="select-none">
    <UiTypePill :objOrKey="data.type" :hide-name="hideName">
      <span :class="colorClass" class="mr-1">{{ amount }}</span>
    </UiTypePill>
    <template v-if="data.for.length">
      for
      <template v-for="(type, i) in data.for" :key="JSON.stringify(type)">
        <span v-if="i !== 0">, </span>
        <UiTypePill :objOrKey="type"/>
      </template>
    </template>
    <template v-if="data.vs.length">
      vs
      <template v-for="(type, i) in data.vs" :key="JSON.stringify(type)">
        <span v-if="i !== 0">, </span>
        <UiTypePill :objOrKey="type"/>
      </template>
    </template>
  </span>
</template>
