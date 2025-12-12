<script setup lang="ts">
import { Ref } from "vue";
import { Tile, useHoveredTile } from "@/stores/hoveredTile";
import { useObjectsStore } from "@/stores/objectStore";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue"; // Force the output type so the IDE in <template> understands refs correctly

const objects = useObjectsStore();

// Force the output type so the IDE in <template> understands refs correctly
// eslint-disable-next-line
const { hoveredTile } = useHoveredTile() as any as { hoveredTile: Ref<Tile> };
</script>

<template>
  <v-sheet class="tile-details" color="secondary" rounded="lg" elevation="2">
    <div v-if="hoveredTile">
      <div>
        <UiObjectChip :type="hoveredTile.elevation" />
        <UiObjectChip :type="hoveredTile.terrain" />
        <UiObjectChip v-if="hoveredTile.feature.value" :type="hoveredTile.feature.value" />
        <UiObjectChip v-if="hoveredTile.isFresh" type="conceptType:freshWater" />
        <span v-if="hoveredTile.isSalt">(Salt Water)</span>
      </div>
      <div>
        <UiObjectChip v-if="hoveredTile.resource.value" :type="hoveredTile.resource.value.name" />
        <UiObjectChip v-if="hoveredTile.naturalWonder" :type="hoveredTile.naturalWonder.name" />
        <UiObjectChip v-if="hoveredTile.pollution.value" :type="hoveredTile.pollution.value.name" />
      </div>
      <div v-if="hoveredTile.playerKey.value">Owner: ({{ hoveredTile.player.value!.name }})</div>
      <div v-if="hoveredTile.unitKeys.value.length > 0">
        Units:
        <span v-for="unit of hoveredTile.units.value" :key="unit.key"> ({{ unit.name }}) </span>
      </div>
      <div>
        <span v-if="hoveredTile.riverKey">River: ({{ hoveredTile.river.value!.name }})</span>
        <UiObjectChip :type="hoveredTile.area" />
        <UiObjectChip :type="hoveredTile.climate" />
        <UiObjectChip :type="hoveredTile.domain" />
      </div>
      <v-code>
        {{ hoveredTile.key }}
      </v-code>
    </div>
  </v-sheet>
</template>

<style scoped>
.tile-details {
  font-size: 0.9rem;
  line-height: 1.4;
  padding: 8px;
}
</style>
