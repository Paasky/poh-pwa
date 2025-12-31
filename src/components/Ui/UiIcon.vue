<script setup lang="ts">
import { computed } from "vue";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getIcon, type IconKey } from "@/types/icons";
import type { ObjectIcon } from "@/Common/Objects/Common";

const props = withDefaults(
  defineProps<{
    icon: IconKey | ObjectIcon;
    size?: "xs" | "sm" | "md" | "lg";
    color?: string;
  }>(),
  {
    size: "sm",
    color: undefined,
  },
);

const resolvedIconData = computed(() => getIcon(props.icon));

const resolvedIcon = computed((): IconDefinition => resolvedIconData.value.icon);

const iconSize = computed(() => {
  switch (props.size) {
    case "xs":
      return "x-small";
    case "sm":
      return "small";
    case "md":
      return "medium";
    case "lg":
      return "large";
    default:
      return "small";
  }
});

const iconColor = computed(() => {
  if (props.color) return props.color;
  return resolvedIconData.value.color;
});
</script>

<template>
  <v-icon :icon="resolvedIcon.iconName" :size="iconSize" :color="iconColor" />
</template>
