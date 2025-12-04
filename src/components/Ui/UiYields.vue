<script setup lang="ts">
import { Yields } from "@/objects/yield";
import UiYield, { yieldProps } from "@/components/Ui/UiYield.vue";

defineProps<{ yields: Yields } & yieldProps>();
</script>

<template>
  <div v-for="y of yields.all()" :key="JSON.stringify(y)">
    <UiYield :y="y" :opts="opts" />
  </div>
  <div v-if="yields.isEmpty" style="font-style: italic; opacity: 0.5">None</div>
</template>

<style scoped></style>
