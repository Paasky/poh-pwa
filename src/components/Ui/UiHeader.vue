<script setup lang="ts">
import { useEncyclopediaStore } from '@/components/Encyclopedia/store'
import { computed } from 'vue'

type TypeObjectLike = { key: string }

type TypeObjectOrKey = string | TypeObjectLike

const props = defineProps<{
  title: string
  // Accept either a type object ({ key }) or a key string (e.g., 'conceptType:myth')
  typeObject?: TypeObjectOrKey
}>()

const keyStr = computed(() => {
  if (!props.typeObject) return undefined
  return typeof props.typeObject === 'string' ? props.typeObject : props.typeObject.key
})

const isClickable = computed(() => !!keyStr.value)

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
    <h2 @click="onClick" :class="isClickable ? 'hover:text-yellow-600 cursor-pointer' : ''">{{ title }}</h2>
  </div>
</template>
