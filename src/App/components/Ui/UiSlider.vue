<script setup lang="ts">
import { computed } from "vue";

const model = defineModel<number>();

const props = withDefaults(
  defineProps<{
    label: string;
    min: number;
    max: number;
    step?: number;
    ticks?: null | "show" | "labels";
  }>(),
  {
    step: 1,
    ticks: "labels",
  },
);

const tickLabels = computed(() => {
  if (props.ticks !== "labels") return undefined;
  const labels: Record<number, string> = {};

  const totalSteps = Math.round((props.max - props.min) / props.step);
  const everyNth = Math.ceil(totalSteps / 10);

  for (let i = 0; i <= totalSteps; i++) {
    const value = Number((props.min + i * props.step).toFixed(10)); // Fix precision
    if (i % everyNth === 0 || i === totalSteps) {
      labels[value] = value.toString();
    } else {
      labels[value] = "";
    }
  }
  return labels;
});
</script>

<template>
  <div class="ui-slider">
    <div class="text-caption mb-n2">{{ label }}</div>
    <v-slider
      v-model="model"
      :min="min"
      :max="max"
      :step="step"
      :ticks="tickLabels"
      :show-ticks="ticks ? 'always' : undefined"
      thumb-label
      color="primary"
      hide-details
    />
  </div>
</template>

<style scoped>
.ui-slider {
  width: 100%;
}
</style>
