<script setup lang="ts">
import { computed, PropType } from "vue";
import UiTooltip from "@/components/Ui/UiTooltip.vue";

export type Variant = "solid" | "border" | "pill" | "ghost" | "selected" | "danger";

const props = defineProps({
  disabled: { type: Boolean, default: false },
  tooltip: { type: String, default: null },
  variant: { type: String as PropType<Variant>, default: "solid" },
});

const disabled = computed(() => props.disabled);

const baseClasses =
  "inline-flex items-center h-6 justify-center px-1 py-0.5 rounded-md text-slate-100 border-yellow-600 select-none whitespace-nowrap transition-all duration-0 hover:duration-300 cursor-pointer disabled:bg-neutral-700 disabled:border-neutral-600 disabled:cursor-not-allowed" +
  (props.variant === "selected" ? " disabled:text-neutral-200" : " disabled:text-neutral-500");

const hoverClasses = "hover:bg-yellow-600 hover:text-slate-900";

const variantClasses = computed(() => {
  switch (props.variant) {
    case "border":
      return "border shadow-lg " + hoverClasses;
    case "pill":
      return "border-b shadow-lg " + hoverClasses;
    case "ghost":
      return "" + hoverClasses;
    case "danger":
      return "bg-red-700 shadow-lg hover:bg-red-500 hover:text-slate-900";
    case "selected":
      return "border shadow-lg bg-yellow-700 " + hoverClasses;
    case "solid":
    default:
      return "border border-yellow-900 bg-yellow-900 shadow-lg text-slate-100 " + hoverClasses;
  }
});

const emit = defineEmits<{ (e: "click", ev: MouseEvent): void }>();

function onClick(ev: MouseEvent) {
  if (disabled.value) return;
  emit("click", ev);
}
</script>

<template>
  <UiTooltip v-if="props.tooltip" :text="props.tooltip">
    <button :disabled="disabled" :class="[baseClasses, variantClasses]" @click.stop="onClick">
      <slot />
    </button>
  </UiTooltip>
  <button v-else :disabled="disabled" :class="[baseClasses, variantClasses]" @click="onClick">
    <slot />
  </button>
</template>
