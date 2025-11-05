<script setup lang="ts">
import UiYield from '@/components/Ui/UiYield.vue'
import { Yield } from '@/types/common'

defineProps<{
  yields: Yield[],
  hideName?: boolean
}>()
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

function onClick (ev: MouseEvent) {
  emit('click', ev)
}
</script>

<template>
  <p v-for="data in yields" :key="JSON.stringify(data)" class="mb-1">
    <UiYield :data="data" :hide-name="hideName"/>
  </p>
</template>
