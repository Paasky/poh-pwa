<script setup lang="ts">
import UiButton from "@/components/Ui/UiButton.vue";
import {
  playerDetailConfig,
  usePlayerDetailsStoreNew,
} from "@/components/PlayerDetails/playerDetailsStore";

const store = usePlayerDetailsStoreNew();
</script>

<template>
  <!-- Top-left -->
  <div class="position-absolute top-0 left-0 d-flex flex-wrap ga-1" style="z-index: 10">
    <UiButton
      v-for="item in playerDetailConfig"
      :key="item.id"
      :icon="item.iconClass"
      :icon-color="item.iconColor"
      :text="item.text"
      :effect-text="item.effect.text"
      :effect-class="item.effect.color"
      :tooltip="item.tooltip"
      color="secondary"
      rounded="0"
      size="small"
      class="rounded-b-lg"
      @click="store.open(item.id)"
    />
  </div>
</template>
