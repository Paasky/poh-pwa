<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ObjectIcon } from "@/types/common";
import getIcon from "@/types/icons";

// Props: a full PohType object
defineProps<{ icon: ObjectIcon }>();
</script>

<template>
  <font-awesome-icon
    :icon="icon?.icon ?? getIcon('unknown').icon"
    :style="{ color: icon?.color ?? '#fff' }"
    class="fa-fw"
  />
</template>
