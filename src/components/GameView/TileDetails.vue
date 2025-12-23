<script setup lang="ts">
import { useCurrentContext } from "@/composables/useCurrentContext";
import UiTypeChip from "@/components/Ui/UiTypeChip.vue";
import { useObjectsStore } from "@/stores/objectStore";
import { Tile } from "@/objects/game/Tile";

const hoveredTile = useCurrentContext().hover as unknown as Tile;
</script>

<template>
  <v-sheet class="d-flex flex-column ga-1" color="secondary" style="width: 12rem; overflow: hidden">
    <div
      class="d-flex flex-column ga-1"
      v-if="hoveredTile && useObjectsStore().currentPlayer.knownTileKeys.value.has(hoveredTile.key)"
    >
      <div class="d-flex ga-1">
        <UiTypeChip :type="hoveredTile.elevation" />
        <UiTypeChip :type="hoveredTile.terrain" />
      </div>
      <div
        class="d-flex ga-1"
        v-if="hoveredTile.feature.value || hoveredTile.isFresh || hoveredTile.isSalt"
      >
        <UiTypeChip v-if="hoveredTile.feature.value" :type="hoveredTile.feature.value" />
        <UiTypeChip v-if="hoveredTile.isFresh" type="conceptType:freshWater" />
        <span v-if="hoveredTile.isSalt">(Salt Water)</span>
      </div>
      <div
        class="d-flex ga-1"
        v-if="
          hoveredTile.resource.value || hoveredTile.naturalWonder || hoveredTile.pollution.value
        "
      >
        <UiTypeChip v-if="hoveredTile.resource.value" :type="hoveredTile.resource.value.name" />
        <UiTypeChip v-if="hoveredTile.naturalWonder" :type="hoveredTile.naturalWonder.name" />
        <UiTypeChip v-if="hoveredTile.pollution.value" :type="hoveredTile.pollution.value.name" />
      </div>
      <div v-if="hoveredTile.playerKey.value">Owner: ({{ hoveredTile.player.value!.name }})</div>
      <div class="d-flex ga-1">
        <UiTypeChip :type="hoveredTile.climate" />
        <UiTypeChip :type="hoveredTile.domain" />
      </div>
      <div class="d-flex ga-1">
        <span v-if="hoveredTile.riverKey">({{ hoveredTile.river.value!.name }})</span>
        <UiTypeChip :type="hoveredTile.area" />
      </div>
    </div>
    <div v-else-if="hoveredTile">(Terra Incognita)</div>
    <v-code v-if="hoveredTile" class="mt-auto">
      {{ hoveredTile.key }}
    </v-code>
  </v-sheet>
</template>

<style scoped></style>
