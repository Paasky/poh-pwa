<script setup lang="ts">
import { useHoveredTile } from "@/stores/hoveredTile";
import { useObjectsStore } from "@/stores/objectStore";

const { hoveredTile } = useHoveredTile();
const objects = useObjectsStore();
</script>

<template>
  <v-sheet class="tile-details" color="secondary" rounded="lg" elevation="2">
    <v-card flat color="transparent">
      <v-card-title class="text-subtitle-2">Tile Details</v-card-title>
      <v-divider class="my-1" />

      <v-card-text class="py-2">
        <template v-if="hoveredTile">
          <v-list density="compact" lines="one">
            <v-list-item title="Key" :subtitle="hoveredTile.key" />
            <v-list-item
              title="Coordinates"
              :subtitle="`x${(objects.world?.sizeX ?? 0) - 1 - hoveredTile.x}, y${hoveredTile.y}`"
            />
            <v-list-item
              title="Raw tile coords"
              :subtitle="`x${hoveredTile.x}, y${hoveredTile.y}`"
            />
            <v-divider class="my-1" />
            <v-list-item title="Domain" :subtitle="hoveredTile.domain.name" />
            <v-list-item title="Area" :subtitle="hoveredTile.area.name" />
            <v-list-item title="Climate" :subtitle="hoveredTile.climate.name" />
            <v-list-item title="Terrain" :subtitle="hoveredTile.terrain.name" />
            <v-list-item title="Elevation" :subtitle="hoveredTile.elevation.name" />
            <v-list-item title="Feature" :subtitle="hoveredTile.feature.value?.name ?? '-'" />
            <v-list-item title="Resource" :subtitle="hoveredTile.resource.value?.name ?? '-'" />
            <v-list-item
              title="Natural Wonder"
              :subtitle="hoveredTile.naturalWonder?.name ?? '-'"
            />
            <v-list-item title="Pollution" :subtitle="hoveredTile.pollution.value?.name ?? '-'" />
            <v-divider class="my-1" />
            <v-list-item title="Owner (playerKey)" :subtitle="hoveredTile.playerKey.value ?? '—'" />
            <v-list-item title="Units on tile" :subtitle="`${hoveredTile.unitKeys.length ?? 0}`" />
            <v-list-item
              title="Rivers / Fresh / Salt"
              :subtitle="`${hoveredTile.isMajorRiver ? 'major river' : '—'} · ${hoveredTile.isFresh ? 'fresh' : '—'} · ${hoveredTile.isSalt ? 'salt' : '—'}`"
            />
          </v-list>
        </template>
        <template v-else>
          <div class="text-caption opacity-80">Hover a tile to see details…</div>
        </template>
      </v-card-text>
    </v-card>
  </v-sheet>
</template>

<style scoped>
.tile-details {
  font-size: 0.9rem;
  line-height: 1.4;
  padding: 8px;
}
</style>
