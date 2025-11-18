<script setup lang="ts">
import { useObjectsStore } from '@/stores/objectStore'

const objects = useObjectsStore()
const player = objects.getCurrentPlayer()
</script>

<template>
  <div>
    <div v-for="unit of player.units">
      {{ unit }}
    </div>
  </div>
</template>
