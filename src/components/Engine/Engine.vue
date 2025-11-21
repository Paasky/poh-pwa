<script setup lang="ts">
import { onMounted, onUnmounted, ref, useAttrs } from 'vue'
import { EngineService } from '@/components/Engine/engine'

defineOptions({ inheritAttrs: false })

const containerEl = ref<HTMLElement | null>(null)
const attrs = useAttrs()

onMounted(() => {
  if (containerEl.value) {
    EngineService.attach(containerEl.value)
  }
})

onUnmounted(() => {
  EngineService.detach()
})
</script>

<template>
  <div ref="containerEl" v-bind="attrs"></div>
</template>

<style scoped>

</style>