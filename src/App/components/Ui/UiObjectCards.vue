<script setup lang="ts">
import UiObjectCard from "@/App/components/Ui/UiObjectCard.vue";
import type { TypeObject } from "@/Common/Objects/TypeObject";

// noinspection JSUnusedGlobalSymbols
withDefaults(
  defineProps<{
    types: Set<TypeObject>;
    selected?: Set<TypeObject>; // items currently selected
    selectable?: Set<TypeObject>; // items that can be selected
    selectPos?: "right" | "bottom" | "hidden";
    withSpacer?: boolean;
    showOrBetween?: boolean; // show small "or" label between options
    title?: string; // optional section title rendered above cards
    titleClass?: string; // optional class for title typography
    cardStyle?: string;
  }>(),
  {
    selected: () => [],
    selectable: () => [],
    selectPos: "hidden",
    withSpacer: false,
    showOrBetween: true,
    title: undefined,
    titleClass: "text-h6",
    cardStyle: "",
  },
);
</script>

<template>
  <div>
    <div
      class="pt-2 pa-2 py-1"
      style="border-radius: 0.5rem; background-color: rgba(255, 255, 255, 0.05)"
    >
      <div v-if="title" :class="titleClass" style="text-align: center">{{ title }}</div>

      <template v-for="(type, i) in types" :key="type.key">
        <div
          v-if="showOrBetween && i > 0"
          style="font-style: italic; opacity: 0.5; text-align: center; font-size: 0.75rem"
        >
          or
        </div>
        <UiObjectCard
          :type="type"
          :is-selected="selected.has(type)"
          :can-select="selectable.has(type)"
          :with-spacer="withSpacer"
          :select-pos="selectPos"
          :style="
            'border-radius: 0.5rem; background-color: rgba(0,0,0, 0.33); border: 1px solid rgba(255,255,255,0.25);' +
            cardStyle
          "
        />
      </template>
    </div>
  </div>
</template>

<style scoped></style>
