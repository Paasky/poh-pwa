<script setup lang="ts">
import { ref } from "vue";
import { useAppStore } from "@/stores/appStore";

const app = useAppStore();
const canvasEl = ref<HTMLCanvasElement | null>(null);

function onClick(ev: MouseEvent) {
  // Get % of x/y that was clicked & fly to it
  const rect = canvasEl.value!.getBoundingClientRect();
  const xPercent = (ev.clientX - rect.left) / rect.width;
  const yPercent = (ev.clientY - rect.top) / rect.height;

  const { minX, maxX, minZ, maxZ } = app.pohEngine.minimap!.bounds;

  // Map percentages to the zoomed-in bounding box
  app.pohEngine.flyTo({
    x: minX + xPercent * (maxX - minX),
    z: maxZ - yPercent * (maxZ - minZ), // Flip Y because canvas 0 is top
  });
}
</script>

<template>
  <canvas
    id="minimap-canvas"
    ref="canvasEl"
    width="1024"
    height="512"
    style="display: block; width: 20rem; height: 10rem; background-color: #000; cursor: pointer"
    @click="onClick"
  />
</template>

<style scoped></style>
