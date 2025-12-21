<script setup lang="ts">
import { useCurrentTile } from "@/stores/currentTile";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import { useObjectsStore } from "@/stores/objectStore";

const { selectedTile } = useCurrentTile();
</script>

<template>
  <div
    v-if="selectedTile && useObjectsStore().currentPlayer.knownTileKeys.value.has(selectedTile.key)"
    class="d-flex ga-1"
  >
    <v-sheet
      class="d-flex flex-column ga-1 pa-1"
      color="secondary"
      style="width: 12rem; overflow: hidden"
    >
      <div class="d-flex flex-column ga-1">
        <div class="d-flex ga-1">
          <UiObjectChip :type="selectedTile.elevation" />
          <UiObjectChip :type="selectedTile.terrain" />
        </div>
        <div
          class="d-flex ga-1"
          v-if="selectedTile.feature.value || selectedTile.isFresh || selectedTile.isSalt"
        >
          <UiObjectChip v-if="selectedTile.feature.value" :type="selectedTile.feature.value" />
          <UiObjectChip v-if="selectedTile.isFresh" type="conceptType:freshWater" />
          <span v-if="selectedTile.isSalt">(Salt Water)</span>
        </div>
        <div
          class="d-flex ga-1"
          v-if="
            selectedTile.resource.value ||
            selectedTile.naturalWonder ||
            selectedTile.pollution.value
          "
        >
          <UiObjectChip
            v-if="selectedTile.resource.value"
            :type="selectedTile.resource.value.name"
          />
          <UiObjectChip v-if="selectedTile.naturalWonder" :type="selectedTile.naturalWonder.name" />
          <UiObjectChip
            v-if="selectedTile.pollution.value"
            :type="selectedTile.pollution.value.name"
          />
        </div>
        <div v-if="selectedTile.playerKey.value">
          Owner: ({{ selectedTile.player.value!.name }})
        </div>
        <div class="d-flex ga-1">
          <UiObjectChip :type="selectedTile.climate" />
          <UiObjectChip :type="selectedTile.domain" />
        </div>
        <div class="d-flex ga-1">
          <span v-if="selectedTile.riverKey">({{ selectedTile.river.value!.name }})</span>
          <UiObjectChip :type="selectedTile.area" />
        </div>
      </div>
    </v-sheet>

    <v-sheet
      v-if="selectedTile.unitKeys.value.length > 0 || selectedTile.constructionKey.value"
      class="d-flex flex-column ga-1 pa-1"
      color="secondary"
      style="width: 12rem; overflow: hidden"
    >
      <div v-if="selectedTile.construction.value" class="d-flex flex-column ga-1">
        <div class="text-caption">Construction:</div>
        <UiObjectChip :type="selectedTile.construction.value.type" />
      </div>
      <div v-if="selectedTile.unitKeys.value.length > 0" class="d-flex flex-column ga-1">
        <div class="text-caption">Units:</div>
        <div class="d-flex flex-wrap ga-1">
          <span v-for="unit of selectedTile.units.value" :key="unit.key"
            >({{ unit.design.value.name }})</span
          >
        </div>
      </div>
    </v-sheet>
  </div>
</template>

<style scoped></style>
