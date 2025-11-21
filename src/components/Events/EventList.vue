<script setup lang="ts">
import { useObjectsStore } from '@/stores/objectStore'
import { useEventStore } from '@/stores/eventStore'
import { capitalize } from '@vue/shared'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

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

    <button
        type="button"
        class="text-slate-600 hover:text-slate-400 ml-1 float-right"
        aria-label="Clear"
        title="Clear"
        @click.stop="() => events.turnEvents.splice(events.turnEvents.indexOf(event), 1)"
    >
      <font-awesome-icon :icon="['fas','xmark']" class="fa-fw"/>
    </button>
  </div>
</template>

<style scoped>

</style>