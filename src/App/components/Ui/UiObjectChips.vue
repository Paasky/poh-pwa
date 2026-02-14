<script setup lang="ts">
import { GameObject } from "@/Common/Models/_GameModel";
import UiTypeChip from "@/App/components/Ui/UiTypeChip.vue";
import UiGameObjChip from "@/App/components/Ui/UiGameObjChip.vue";
import { StaticKey } from "@/Common/Static/StaticEnums";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";

defineProps<{
  types: (StaticKey | TypeObject | GameObject)[];
  // when true, render chips on a single row and make them fill the available space equally
  singleRow?: boolean;
}>();

function isGameObject(type: StaticKey | TypeObject | GameObject): boolean {
  return type instanceof GameObject;
}
</script>

<template>
  <div :class="['d-flex', singleRow ? 'w-100 flex-nowrap ga-1' : 'flex-wrap ga-1']">
    <template v-for="type of types" :key="JSON.stringify(type)">
      <UiGameObjChip v-if="isGameObject(type)" :obj="type as GameObject" v-bind="$attrs" />
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
