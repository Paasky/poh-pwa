<script setup lang="ts">
import { withDefaults, defineProps } from "vue";

type Location =
  | "top"
  | "bottom"
  | "start"
  | "end"
  | "top start"
  | "top end"
  | "bottom start"
  | "bottom end"
  | "start top"
  | "start bottom"
  | "end top"
  | "end bottom";

const props = withDefaults(
  defineProps<{
    text: string;
    location?: Location;
    contentClass?: string;
  }>(),
  {
    location: "bottom",
    contentClass: "text-grey bg-grey-darken-4",
  }
);
</script>

<template>
  <!-- Pass any extra attrs directly to v-tooltip (e.g., open-on-click, disabled, etc.) -->
  <v-tooltip :text="props.text" :location="props.location" :content-class="props.contentClass" v-bind="$attrs">
    <template #activator="{ props: tip }">
      <!-- Apply Vuetify-provided activator props to an inline wrapper.
           This keeps consumer usage clean: <UiTooltip> <v-icon/> </UiTooltip> -->
      <span class="ui-tooltip-activator" v-bind="tip">
        <slot />
      </span>
    </template>
  </v-tooltip>
  
</template>

<style scoped>
.ui-tooltip-activator {
  display: inline-flex;
  align-items: center;
}
</style>
