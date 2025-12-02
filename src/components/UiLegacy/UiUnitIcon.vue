<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { UnitDesign } from "@/objects/game/UnitDesign";

// Props: a full PohType object
defineProps<{ design: UnitDesign }>();
</script>

<template>
  <div class="inline-block relative ml-4">
    <font-awesome-icon :icon="design.platform.icon.icon" style="color: #fff" class="fa-fw" />
    <font-awesome-icon
      :icon="design.equipment.icon.icon"
      style="background-color: rgba(0, 0, 0, 0.5); border-radius: 33%"
      :style="{ color: design.equipment.icon.color }"
      class="fa-fw text-[85%] absolute left-[-33%] bottom-[15%]"
    />
  </div>
</template>
