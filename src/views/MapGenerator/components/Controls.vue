<script setup lang="ts">
defineOptions({ name: "MapGenControls" });
import { computed, type WritableComputedRef } from "vue";
import UiDropdown from "@/components/Ui/UiDropdown.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import type { WorldSize } from "@/factories/worldFactory";
import { useMapGenStore } from "@/stores/mapGenStore";

const store = useMapGenStore();

// For size dropdown we show current x/y pair
const sizeModel: WritableComputedRef<{ x: number; y: number }> = computed({
  get: () => ({ x: store.worldValues.x, y: store.worldValues.y }),
  set: (v: { x: number; y: number }) => store.updateSize(v),
});

function updateWorld<K extends keyof WorldSize>(key: K, value: WorldSize[K]) {
  store.updateWorld(key, value);
}

function updateAlignment(value: typeof store.alignment) {
  store.setAlignment(value);
}

function onSizeChange(v: { x: number; y: number }) {
  // computed with get/set, so assign via its setter
  sizeModel.value = v; // UiDropdown emits plain object; setter handles shape
}
</script>

<template>
  <div
    class="mx-auto w-full max-w-full min-w-[72rem] flex flex-wrap items-start gap-3"
  >
    <div class="min-w-[14rem]">
      <UiDropdown
        :options="store.sizeOptions"
        :model-value="sizeModel"
        label="Size"
        @update:model-value="onSizeChange"
      />
      <div class="text-xs text-slate-400 mt-1">
        Est. memory {{ store.memInfo.minMB }}–{{ store.memInfo.maxMB }} MB • CPU
        {{ store.memInfo.cpu }}
      </div>
    </div>

    <UiDropdown
      label="Continents"
      :model-value="store.worldValues.continents"
      :options="store.continentsOptions"
      @update:model-value="(v: number) => updateWorld('continents', v)"
    />
    <UiDropdown
      label="Majors / Continent"
      :model-value="store.worldValues.majorsPerContinent"
      :options="store.majorsOptions"
      @update:model-value="(v: number) => updateWorld('majorsPerContinent', v)"
    />
    <UiDropdown
      label="Minors / Player"
      :model-value="store.worldValues.minorsPerPlayer"
      :options="store.minorsOptions"
      @update:model-value="(v: number) => updateWorld('minorsPerPlayer', v)"
    />
    <UiDropdown
      label="Alignment"
      :model-value="store.alignment"
      :options="store.alignmentOptions"
      @update:model-value="(v) => updateAlignment(v)"
    />

    <UiButton @click.prevent="store.generate()">
      Generate
    </UiButton>
  </div>
</template>

<style scoped></style>
