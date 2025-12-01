<script setup lang="ts">
import { ObjKey } from "@/types/common";
import UiObjPillList from "@/components/Ui/UiObjPillList.vue";
import { Requires } from "@/objects/requires";

defineProps<{
  requires: Requires;
  noMargin?: boolean;
  shortName?: boolean;
}>();
const emit = defineEmits<{ (e: "click", ev: MouseEvent): void }>();

function onClick(ev: MouseEvent) {
  emit("click", ev);
}
</script>

<template>
  <UiObjPillList
    :obj-keys="
      // eslint-disable-next-line vue/no-deprecated-filter
      [...requires.requireAll, ...requires.requireAny] as ObjKey[] | ObjKey[][]
    "
    :no-margin="noMargin"
    :short-name="shortName"
    @click="onClick"
  />
</template>
