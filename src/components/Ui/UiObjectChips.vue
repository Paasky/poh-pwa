<script setup lang="ts">
import { isGameObject, ObjKey, PohObject } from "@/types/common";
import { GameObject } from "@/objects/game/_GameObject";
import UiTypeChip from "@/components/Ui/UiTypeChip.vue";
import UiGameObjChip from "@/components/Ui/UiGameObjChip.vue";

defineProps<{
  types: (string | ObjKey | PohObject | GameObject)[];
  // when true, render chips on a single row and make them fill the available space equally
  singleRow?: boolean;
}>();
</script>

<template>
  <div :class="['d-flex', singleRow ? 'w-100 flex-nowrap ga-1' : 'flex-wrap ga-1']">
    <template v-for="type of types" :key="JSON.stringify(type)">
      <UiGameObjChip v-if="isGameObject(type)" :obj="type" v-bind="$attrs" />
      <UiTypeChip
        v-else
        :type="type"
        :style="singleRow ? 'flex: 1 1 0' : undefined"
        v-bind="$attrs"
      />
    </template>
  </div>
</template>

<style scoped></style>
