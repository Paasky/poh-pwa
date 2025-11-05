<script setup lang="ts">

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ObjectIcon } from '@/types/common'

// Props: a full PohType object
defineProps<{ icon: ObjectIcon }>()
</script>

<template>
  <font-awesome-icon
    :icon="icon.icon"
    :style="{ color: icon.color }"
    class="fa-fw"
  />
</template>
