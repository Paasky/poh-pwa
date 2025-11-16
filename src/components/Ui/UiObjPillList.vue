<script setup lang="ts">
import { computed } from 'vue'
import UiObjPill from '@/components/Ui/UiTypePill.vue'
import { useObjectsStore } from '@/stores/objectStore'
import { ObjKey } from '@/types/common'

const props = defineProps<{
  objKeys: ObjKey[] | ObjKey[][],
  noMargin?: boolean
  shortName?: boolean
}>()
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
const objsOrAny = computed(() => props.objKeys.map((key) => Array.isArray(key)
    ? key.map((anyKey) => useObjectsStore().get(anyKey))
    : useObjectsStore().get(key)
))

function onClick (ev: MouseEvent) {
  emit('click', ev)
}
</script>

<template>
  <p v-for="objOrAny in objsOrAny" :key="JSON.stringify(objOrAny)" :class="noMargin ? '' : 'mb-2'">
    <template v-if="Array.isArray(objOrAny)">
      <template v-for="(obj, i) in objOrAny" :key="JSON.stringify(obj)">
        <span v-if="i !== 0"> or </span>
        <UiObjPill :objOrKey="obj" :short-name="shortName"/>
      </template>
    </template>
    <UiObjPill v-else :objOrKey="objOrAny" :short-name="shortName"/>
  </p>
</template>
