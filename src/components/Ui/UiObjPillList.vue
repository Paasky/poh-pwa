<script setup lang="ts">
import { computed } from "vue";
import UiObjPill from "@/components/Ui/UiObjPill.vue";
import { useObjectsStore } from "@/stores/objectStore";
import { ObjKey, PohObject } from "@/types/common";

const props = defineProps<{
  objKeys: ObjKey[] | ObjKey[][];
  noMargin?: boolean;
  shortName?: boolean;
}>();
defineEmits<{ (e: "click", ev: MouseEvent): void }>();
const objsOrAny = computed(() =>
  props.objKeys.map((key) =>
    Array.isArray(key)
      ? key.map((anyKey) => useObjectsStore().get(anyKey) as PohObject)
      : (useObjectsStore().get(key) as PohObject),
  ),
);
</script>

<template>
  <p
    v-for="objOrAny in objsOrAny"
    :key="JSON.stringify(objOrAny)"
    :class="noMargin ? '' : 'mb-2'"
  >
    <template v-if="Array.isArray(objOrAny)">
      <template
        v-for="(obj, i) in objOrAny"
        :key="JSON.stringify(obj)"
      >
        <span v-if="i !== 0"> or </span>
        <UiObjPill
          :obj-or-key="obj"
          :short-name="shortName"
        />
      </template>
    </template>
    <UiObjPill
      v-else
      :obj-or-key="objOrAny"
      :short-name="shortName"
    />
  </p>
</template>
