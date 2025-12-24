<script setup lang="ts">
import { computed } from "vue";
import { Unit } from "@/objects/game/Unit";
import { UnitDesign } from "@/objects/game/UnitDesign";

const props = withDefaults(
  defineProps<{
    unit?: Unit;
    design?: UnitDesign;
    size?: number;
  }>(),
  {
    unit: undefined,
    design: undefined,
    size: 36,
  },
);

const d = computed(() => props.unit?.design.value ?? props.design);

const platformIcon = computed(() => d.value?.platform.icon.icon.iconName);
const equipmentIcon = computed(() => d.value?.equipment.icon.icon.iconName);

const domainColor = computed(() => {
  const domain = d.value?.domainKey();
  if (domain === "domainType:water") return "lightBlue";
  if (domain === "domainType:air") return "lightBlue"; // fallback for now if cyan is missing
  if (domain === "domainType:space") return "lightPurple";
  return "gray";
});

const playerColor = "#fff";
// const playerColor = computed(() => props.unit?.player.value.color);
</script>

<template>
  <div
    v-if="d"
    class="position-relative d-inline-flex align-center justify-center rounded-circle"
    :style="{
      width: size + 'px',
      height: size + 'px',
      border: `2px solid ${playerColor}`,
      backgroundColor: 'rgba(0,0,0,0.2)',
    }"
  >
    <v-icon :icon="platformIcon" :color="domainColor" :size="size * 0.7" />
    <v-icon
      :icon="equipmentIcon"
      color="white"
      :size="size * 0.5"
      class="position-absolute"
      style="filter: drop-shadow(0 0 2px black)"
    />
  </div>
</template>

<style scoped></style>
