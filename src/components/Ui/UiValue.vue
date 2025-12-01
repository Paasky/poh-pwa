<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number | string;
    isPositive?: boolean | null;
  }>(),
  {
    isPositive: null,
  },
);

const displayText = computed<string>(() => {
  if (typeof props.value === "string") return props.value || "0";
  if (!props.value) return "0";
  return props.value > 0 ? `+${props.value}` : `${props.value}`;
});

const colorClass = computed<string>(() => {
  if (props.isPositive !== null) return props.isPositive ? "text-green-400" : "text-red-400";
  if (typeof props.value === "string" || !props.value) return "";
  return props.value > 0 ? "text-green-400" : "text-red-400";
});
</script>

<template>
  <span :class="['select-none px-1', colorClass]">{{ displayText }}</span>
</template>
