<script setup lang="ts">
import { ObjKey, Requires } from '@/types/common'
import UiObjPillList from '@/components/Ui/UiObjPillList.vue'

defineProps<{
  requires: Requires,
  noMargin?: boolean
  shortName?: boolean
}>()
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

function onClick (ev: MouseEvent) {
  emit('click', ev)
}
</script>

<template>
  <UiObjPillList :obj-keys="[...requires.requireAll, ...requires.requireAny] as ObjKey[] | ObjKey[][]"
                 :no-margin="noMargin"
                 :short-name="shortName"
                 @click="onClick"
  />
</template>
