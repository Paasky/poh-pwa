<script setup lang="ts">
import { useCurrentContext } from "@/composables/useCurrentContext";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import { useObjectsStore } from "@/stores/objectStore";

const { hover: hoveredTile } = useCurrentContext();
</script>

<template>
  <v-sheet class="d-flex flex-column ga-1" color="secondary" style="width: 12rem; overflow: hidden">
    <div
      class="d-flex flex-column ga-1"
      v-if="hoveredTile && useObjectsStore().currentPlayer.knownTileKeys.value.has(hoveredTile.key)"
    >
      <div class="d-flex ga-1">
        <UiObjectChip :type="hoveredTile.elevation" />
        <UiObjectChip :type="hoveredTile.terrain" />
      </div>
      <div
        class="d-flex ga-1"
        v-if="hoveredTile.feature || hoveredTile.isFresh || hoveredTile.isSalt"
      >
        <UiObjectChip v-if="hoveredTile.feature" :type="hoveredTile.feature" />
        <UiObjectChip v-if="hoveredTile.isFresh" type="conceptType:freshWater" />
        <span v-if="hoveredTile.isSalt">(Salt Water)</span>
      </div>
      <div
        class="d-flex ga-1"
        v-if="hoveredTile.resource || hoveredTile.naturalWonder || hoveredTile.pollution"
      >
        <UiObjectChip v-if="hoveredTile.resource" :type="hoveredTile.resource.name" />
        <UiObjectChip v-if="hoveredTile.naturalWonder" :type="hoveredTile.naturalWonder.name" />
        <UiObjectChip v-if="hoveredTile.pollution" :type="hoveredTile.pollution.name" />
      </div>
      <div v-if="hoveredTile.playerKey">Owner: ({{ hoveredTile.player!.name }})</div>
      <div v-if="hoveredTile.unitKeys.length > 0" class="d-flex ga-1">
        Units:
        <span v-for="unit of hoveredTile.units" :key="unit.key"> ({{ unit.name }}) </span>
      </div>
      <div class="d-flex ga-1">
        <UiObjectChip :type="hoveredTile.climate" />
        <UiObjectChip :type="hoveredTile.domain" />
      </div>
      <div class="d-flex ga-1">
        <span v-if="hoveredTile.riverKey">({{ hoveredTile.river!.name }})</span>
        <UiObjectChip :type="hoveredTile.area" />
      </div>
    </div>
    <div v-else-if="hoveredTile">(Terra Incognita)</div>
    <v-code v-if="hoveredTile" class="mt-auto">
      {{ hoveredTile.key }}
    </v-code>
  </v-sheet>
</template>

<style scoped></style>
