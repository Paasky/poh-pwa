<script setup lang="ts">
import { useObjectsStore } from '@/stores/objectStore'
import { useEventStore } from '@/stores/eventStore'
import { capitalize } from '@vue/shared'

const objects = useObjectsStore()
const events = useEventStore()
</script>

<template>
  <div v-for="event of events.turnEvents"
       :key="event.id"
       @click="events.open(event)"
       class="hover:text-yellow-600 cursor-pointer px-2 py-1 border-t first:border-t-0 border-yellow-800/20"
       :class="event.read ? 'text-yellow-800' : 'text-yellow-600'"
  >
    {{ capitalize(event.title) }}
  </div>
</template>

<style scoped>

</style>