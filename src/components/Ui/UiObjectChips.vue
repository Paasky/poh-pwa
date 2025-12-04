<script setup lang="ts">
import { ObjKey, PohObject } from "@/types/common";
import { GameObject } from "@/objects/game/_GameObject";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";

defineProps<{
  types: (string | ObjKey | PohObject | GameObject)[];
}>();
</script>

<template>
  <div class="d-flex flex-wrap ga-1">
    <UiObjectChip v-for="type of types" :key="JSON.stringify(type)" :type="type" v-bind="$attrs" />
  </div>
</template>

<style scoped></style>
