<script setup lang="ts">
import { computed } from "vue";
import { Yields } from "@/Common/Objects/Yields";
import UiYield, { yieldProps } from "@/components/Ui/UiYield.vue";

const props = defineProps<{ yields: Yields } & yieldProps>();

const sortedYields = computed(() => {
  return props.yields.all().sort((a, b) => a.type.localeCompare(b.type));
});
</script>

<template>
  <div v-for="y of sortedYields" :key="JSON.stringify(y)">
    <UiYield :y="y" :opts="opts" />
  </div>
  <div v-if="yields.isEmpty" style="font-style: italic; opacity: 0.5">None</div>
</template>

<style scoped></style>
