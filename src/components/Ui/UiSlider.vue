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
  const everyNth = Math.ceil((props.max - props.min) / props.step / 10);

  for (let i = props.min; i <= props.max; i += props.step) {
    labels[i] = i % everyNth === 0 ? i.toString() : "";
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
