<script setup lang="ts">
import { useEventStore } from "@/stores/eventStore";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { GameEvent } from "@/types/events";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const events = useEventStore();
</script>

<template>
  <div
    v-for="event of events.turnEvents"
    :key="event.id"
    class="hover:text-yellow-600 cursor-pointer px-2 py-1 border-t first:border-t-0 border-yellow-800/20"
    :class="event.read ? 'text-yellow-800' : 'text-yellow-600'"
    @click="events.open(event as GameEvent)"
  >
    {{ capitalize(event.title) }}

    <button
      type="button"
      class="text-slate-600 hover:text-slate-400 ml-1 float-right"
      aria-label="Clear"
      title="Clear"
      @click.stop="() => events.turnEvents.splice(events.turnEvents.indexOf(event), 1)"
    >
      <font-awesome-icon :icon="['fas', 'xmark']" class="fa-fw" />
    </button>
  </div>
</template>

<style scoped></style>
