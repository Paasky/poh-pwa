<script setup lang="ts">
import { computed } from "vue";
import type { IconKey } from "@/types/icons";
import type { ObjectIcon } from "@/Common/Objects/Common";
import UiIcon from "@/components/Ui/UiIcon.vue";
import UiTooltip from "@/components/Ui/UiTooltip.vue";

export type UiButtonSize = "small" | "default" | "large" | "x-large";

export type UiButtonType =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "text"
  | "utility";

const props = withDefaults(
  defineProps<{
    type?: UiButtonType;
    isBlock?: boolean;
    isDisabled?: boolean;
    size?: UiButtonSize;
    rounded?: string;
    icon?: IconKey | ObjectIcon;
    iconColor?: string;
    text?: string;
    effectText?: string;
    effectClass?: string;
    effectIsUnder?: boolean;
    tooltip?: string;
  }>(),
  {
    type: "primary",
    isBlock: false,
    isDisabled: false,
    size: "small",
    rounded: "lg",
    effectIsUnder: false,
  },
);

const themeMapping = computed(() => {
  switch (props.type) {
    case "secondary":
      return { color: "secondary", variant: "elevated" as const };
    case "danger":
      return { color: "error", variant: "elevated" as const };
    case "success":
      return { color: "success", variant: "elevated" as const };
    case "warning":
      return { color: "warning", variant: "tonal" as const };
    case "text":
      return { color: undefined, variant: "text" as const };
    case "utility":
      return { color: "tertiary", variant: "elevated" as const };
    case "primary":
    default:
      return { color: "primary", variant: "elevated" as const };
  }
});

const btnProps = computed(() => ({
  ...themeMapping.value,
  disabled: props.isDisabled,
  size: props.size,
  rounded: props.rounded,
  block: props.isBlock,
}));

const tooltipProps = computed(() =>
  props.tooltip ? { text: props.tooltip, location: "bottom" } : {},
);
</script>

<template>
  <component
    :is="tooltip ? UiTooltip : 'div'"
    v-bind="tooltipProps"
    :class="{ 'd-inline-block': tooltip, 'w-100': isBlock }"
  >
    <v-btn
      v-bind="{ ...btnProps, ...$attrs }"
      :style="isDisabled ? 'background-color: #000 !important;opacity:0.25;' : ''"
    >
      <div class="d-flex ga-1" :class="effectIsUnder ? 'flex-column' : 'align-center'">
        <div class="d-flex ga-2 align-center justify-center text-none font-weight-bold">
          <UiIcon v-if="icon" :icon="icon" :color="iconColor" />
          <span v-if="text">{{ text }}</span>
        </div>
        <div v-if="effectText" class="opacity-50 text-caption" :class="effectClass">
          {{ effectText }}
        </div>
      </div>
    </v-btn>
  </component>
</template>

<style scoped></style>
