<script setup lang="ts">
import { ref } from "vue";
import { useAppStore } from "@/stores/appStore";

const app = useAppStore();
const canvasEl = ref<HTMLCanvasElement | null>(null);

function onClick(ev: MouseEvent) {
  const canvas = canvasEl.value;
  if (!canvas) return;

  // Get % of x/y that was clicked & fly to it
  const rect = canvas.getBoundingClientRect();
  app.engineService.flyToPercent(
    (ev.clientX - rect.left) / rect.width,
    (ev.clientY - rect.top) / rect.height,
  );
}
</script>

<template>
  <canvas
    id="minimap-canvas"
    ref="canvasEl"
    width="512"
    height="256"
    style="display: block; width: 20rem; height: 10rem; background-color: #000; cursor: pointer"
    @click="onClick"
  />
</template>

<style scoped></style>
