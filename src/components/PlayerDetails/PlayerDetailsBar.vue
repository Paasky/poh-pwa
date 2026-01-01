<script setup lang="ts">
import UiButton from "@/components/Ui/UiButton.vue";
import {
  playerDetailConfig,
  usePlayerDetailsStore,
} from "@/components/PlayerDetails/playerDetailsStore";

const store = usePlayerDetailsStore();
</script>

<template>
  <!-- Top-left -->
  <div class="d-flex flex-wrap ga-1">
    <UiButton
      v-for="item in playerDetailConfig"
      :key="item.id"
      :icon="item.icon"
      :icon-color="item.iconColor"
      :text="item.text"
      :effect-text="item.effect.text"
      :effect-class="item.effect.color"
      :tooltip="item.tooltip"
      type="secondary"
      rounded="b-lg"
      @click="store.open(item.id)"
    />
  </div>
</template>
