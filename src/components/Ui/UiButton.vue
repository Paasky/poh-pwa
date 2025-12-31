<script setup lang="ts">
import type { IconKey } from "@/types/icons";
import type { ObjectIcon } from "@/Common/Objects/Common";
import UiIcon from "@/components/Ui/UiIcon.vue";

type Density = "default" | "comfortable" | "compact";
type Variant = "elevated" | "flat" | "outlined" | "tonal" | "text" | "plain";
// Vuetify size tokens
type Size = "x-small" | "small" | "default" | "large" | "x-large";
// Vuetify rounded tokens (subset of common values)
type Rounded = false | true | number | "0" | "xs" | "sm" | "md" | "lg" | "xl" | "pill" | "circle";
type Location = "top" | "bottom" | "start" | "end";

withDefaults(
  defineProps<{
    // Styling
    color?: string; // use any Vuetify theme color key or CSS color
    density?: Density;
    variant?: Variant;
    size?: Size;
    rounded?: Rounded;
    elevation?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;
    // Content
    icon?: IconKey | ObjectIcon;
    iconColor?: string; // Vuetify theme color key
    text?: string;
    effectText?: string;
    effectClass?: string;
    // Tooltip
    tooltip?: string;
    tooltipLocation?: Location;
  }>(),
  {
    color: "primary",
    density: "default",
    variant: "elevated",
    size: "small",
    rounded: "lg",
    elevation: 4,
    // Content
    icon: undefined,
    iconColor: undefined, // Vuetify theme color key
    text: undefined,
    effectText: undefined,
    effectClass: undefined,
    // Tooltip
    tooltip: undefined,
    tooltipLocation: "bottom",
  },
);
</script>

<template>
  <v-tooltip
    v-if="tooltip"
    :text="tooltip"
    :location="tooltipLocation"
    content-class="text-grey bg-grey-darken-4"
  >
    <template #activator="{ props: tip }">
      <v-btn
        v-bind="{ ...$attrs, ...tip }"
        :color="color"
        :density="density"
        :variant="variant"
        :elevation="elevation"
        :size="size"
        :rounded="rounded"
        class="d-flex flex-wrap ga-1"
      >
        <UiIcon v-if="icon" :icon="icon" :color="iconColor" class="me-1" />
        <div v-if="text || effectText" class="d-flex flex-wrap ga-1 text-normal-case">
          <div v-if="text">{{ text }}</div>
          <div v-if="effectText" class="opacity-50 text-caption" :class="effectClass">
            {{ effectText }}
          </div>
        </div>
      </v-btn>
    </template>
  </v-tooltip>
  <v-btn
    v-else
    v-bind="$attrs"
    :color="color"
    :density="density"
    :variant="variant"
    :elevation="elevation"
    :size="size"
    :rounded="rounded"
    class="d-flex flex-wrap ga-1"
  >
    <UiIcon v-if="icon" :icon="icon" :color="iconColor" class="me-1" />
    <div v-if="text || effectText" class="d-flex flex-wrap ga-1 text-normal-case">
      <div v-if="text">{{ text }}</div>
      <div v-if="effectText" class="opacity-50 text-caption" :class="effectClass">
        {{ effectText }}
      </div>
    </div>
  </v-btn>
</template>

<style scoped>
.text-normal-case {
  text-transform: none;
  letter-spacing: normal;
}
</style>
