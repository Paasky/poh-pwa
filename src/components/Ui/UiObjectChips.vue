<script setup lang="ts">
import { ObjKey, PohObject } from "@/types/common";
import { GameObject } from "@/objects/game/_GameObject";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";

defineProps<{
  types: (string | ObjKey | PohObject | GameObject)[];
  // when true, render chips on a single row and make them fill the available space equally
  singleRow?: boolean;
}>();
</script>

<template>
  <div :class="['d-flex', singleRow ? 'w-100 flex-nowrap ga-1' : 'flex-wrap ga-1']">
    <UiObjectChip
      v-for="type of types"
      :key="JSON.stringify(type)"
      :type="type"
      :style="singleRow ? 'flex: 1 1 0' : undefined"
      v-bind="$attrs"
    />
  </div>
</template>

<style scoped></style>
