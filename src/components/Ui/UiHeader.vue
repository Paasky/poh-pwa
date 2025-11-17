<script setup lang="ts">
import { useEncyclopediaStore } from '@/components/Encyclopedia/encyclopediaStore'
import { computed } from 'vue'
import { TypeKey } from '@/types/common'
import { TypeObject } from '@/types/typeObjects'

const props = defineProps<{
  title: string
  type?: TypeKey | TypeObject
}>()

const keyStr = computed((): TypeKey | undefined => {
  if (!props.type) return undefined
  return typeof props.type === 'object' ? props.type.key : props.type
})

function onClick () {
  if (keyStr.value) {
    // Open the encyclopedia entry for the provided key
    useEncyclopediaStore().openType(keyStr.value)
  }
}
</script>

<template>
  <!-- Root element keeps the shared styling; parent can extend with class/style/positioning -->
  <div
      class="text-3xl text-center pt-6 select-none text-yellow-800"
      :style="{ background: 'linear-gradient(0deg,rgba(133, 77, 14, 0) 67%, rgba(133, 77, 14, 0.5) 100%)' }"
  >
    <h2 @click="onClick" :class="keyStr ? 'inline-block hover:text-yellow-600 cursor-pointer' : ''">
      {{ title }}
    </h2>
  </div>
</template>
