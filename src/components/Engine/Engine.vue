<script setup lang="ts">
defineOptions({ name: "GameEngine", inheritAttrs: false });
import { onMounted, onUnmounted, ref, useAttrs } from "vue";
import { EngineService } from "@/components/Engine/EngineService";

const containerEl = ref<HTMLElement | null>(null);
const attrs = useAttrs();

onMounted(() => {
  if (containerEl.value) {
    EngineService.attach(containerEl.value);
  }
});

onUnmounted(() => {
  EngineService.detach();
});
</script>

<template>
  <div ref="containerEl" v-bind="attrs" />
</template>

<style scoped></style>
