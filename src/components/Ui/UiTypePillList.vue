<script setup lang="ts">
import { computed } from 'vue'
import UiTypePill from '@/components/Ui/UiTypePill.vue'
import { useObjectsStore } from '@/stores/objectStore'

const props = defineProps<{
  typeKeys: string[] | string[][],
  noMargin?: boolean
  shortName?: boolean
}>()
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
const typesOrAny = computed(() => props.typeKeys.map((key) => typeof key === 'string'
    ? useObjectsStore().get(key)
    : key.map((anyKey) => useObjectsStore().get(anyKey))
))

function onClick (ev: MouseEvent) {
  emit('click', ev)
}
</script>

<template>
  <p v-for="typeOrAny in typesOrAny" :key="JSON.stringify(typeOrAny)" :class="noMargin ? '' : 'mb-2'">
    <template v-if="Array.isArray(typeOrAny)">
      <template v-for="(type, i) in typeOrAny" :key="JSON.stringify(type)">
        <span v-if="i !== 0"> or </span>
        <UiTypePill :objOrKey="type" :short-name="shortName"/>
      </template>
    </template>
    <UiTypePill v-else :objOrKey="typeOrAny" :short-name="shortName"/>
  </p>
</template>
