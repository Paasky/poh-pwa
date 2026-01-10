<script setup lang="ts">
import { computed } from "vue";
import { useMapGenStore } from "@/App/stores/mapGenStore";
import { TypeObject } from "@/Common/Objects/TypeObject";

const props = defineProps<{ variant: "strat" | "reg" | "game" }>();

const store = useMapGenStore();

const tiles = computed(() => {
  switch (props.variant) {
    case "strat":
      return store.renderTiles.strat;
    case "reg":
      return store.renderTiles.reg;
    case "game":
      return store.renderTiles.game;
    default:
      return store.renderTiles.strat;
  }
});
</script>

<template>
  <section
    class="select-none map-gen-preview"
    :class="{
      terrain: store.toggles.showTerrain,
      areas: store.toggles.showAreas,
      starts: store.toggles.showMajorStarts,
      rivers: store.toggles.showRivers,
      'fresh-salt': store.toggles.showFreshSalt,
      elevation: store.toggles.showElevation,
      features: store.toggles.showFeatures,
    }"
  >
    <div v-for="(row, y) of tiles" :key="y" class="map-gen-row">
      <div
        v-for="(tile, x) of row"
        :key="x"
        :class="
          [
            tile.domain.key.replace(':', '-'),
            tile.climate.key.replace(':', '-'),
            tile.terrain.key.replace(':', '-'),
            tile.elevation.key.replace(':', '-'),
            (tile.feature as any as TypeObject)?.key,
            (tile.resource as any as TypeObject)?.key,
            tile.naturalWonder?.key,
            tile.isSalt ? 'salt' : tile.isFresh ? 'fresh' : null,
          ].filter(Boolean)
        "
      >
        <div class="area" :class="[tile.area.key.replace(':', '-'), tile.area.key.substring(0, 1)]">
          {{
            tile.area.key.startsWith("continentType:")
              ? tile.area.key.split(":")[1].substring(0, 2).toUpperCase()
              : tile.area.key.split(":")[1].substring(0, 2)
          }}
        </div>
        <div v-if="tile.elevation.id !== 'flat'" class="e-i">
          <UiIcon :icon="tile.elevation.icon" />
        </div>
        <div v-if="tile.feature" class="f-i">
          <UiIcon :icon="tile.feature.icon" />
        </div>
        <div v-if="tile.isFresh || tile.isSalt" class="fr-sa">
          {{ tile.isFresh ? "F" : "s" }}
        </div>
        <div v-if="tile.isStart" class="start">
          {{ tile.isStart === "major" ? "x" : "o" }}
        </div>
        <div v-if="tile.riverKey" class="river">
          {{ tile.isMajorRiver ? "R" : "r" }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-gen-preview {
  font-size: 0.5rem;
}

.map-gen-row {
  height: 2em;
  white-space: nowrap;
}

.map-gen-row > div {
  display: inline-block;
  height: 2em;
  width: 2em;
  overflow: hidden;
}

.map-gen-row > div > div {
  opacity: 0;
  height: 2em;
  width: 2em;
  line-height: 2em;
  position: absolute;
  text-align: center;
}

.map-gen-preview.elevation .e-i {
  opacity: 1;
  margin-top: -0.5em;
}

.map-gen-preview.features .f-i {
  opacity: 1;
  margin-top: 0.25em;
}

.map-gen-preview.fresh-salt .fr-sa {
  opacity: 1;
}

.map-gen-preview.starts .start {
  opacity: 1;
  margin-top: 0.5em;
  margin-left: 0.5em;
  height: 1em;
  width: 1em;
  line-height: 0.75em;
  border-radius: 100%;
  background: rgba(0, 0, 0, 0.75);
}

.map-gen-preview.rivers .river {
  opacity: 1;
  margin-top: 0.5em;
  margin-left: 0.5em;
  height: 1em;
  width: 1em;
  line-height: 0.75em;
  border-radius: 100%;
  background: rgba(30, 58, 138, 0.75);
}

.map-gen-preview.areas .area {
  opacity: 1;
  width: 2em;
  line-height: 2em;
  position: absolute;
  text-align: center;
}

.map-gen-preview.areas .area.c {
  color: #000;
}

.map-gen-preview.areas .area.o {
  color: #33f;
}

/****************************************
  * Terrain
  */

.map-gen-preview.terrain .terrainType-ocean {
  background: #172554;
}

.map-gen-preview.terrain .terrainType-sea {
  background: #1e3a8a;
}

.map-gen-preview.terrain .terrainType-ocean {
  background: #172554;
}

.map-gen-preview.terrain .terrainType-sea {
  background: #1e3a8a;
}

.map-gen-preview.terrain .terrainType-coast {
  background: #1e5f8aff;
}

.map-gen-preview.terrain .terrainType-lake {
  background: #164e63;
}

.map-gen-preview.terrain .terrainType-river {
  background: #1e3a8a;
}

.map-gen-preview.terrain .terrainType-grass {
  background: #3f6212;
}

.map-gen-preview.terrain .terrainType-grass.climateType-tropical {
  background: #094200;
}

.map-gen-preview.terrain .terrainType-plains {
  background: #575310;
}

.map-gen-preview.terrain .terrainType-desert {
  background: #b8b83b;
}

.map-gen-preview.terrain .terrainType-tundra {
  background: #3e5234;
}

.map-gen-preview.terrain .terrainType-snow {
  background: #a0a1a8ff;
}

/****************************************
  * Continents
  */

.map-gen-preview.areas .continentType-america {
  background: hsla(285, 65%, 70%, 1);
}

.map-gen-preview.areas .continentType-andea {
  background: hsla(330, 80%, 60%, 1);
}

.map-gen-preview.areas .continentType-taiga {
  background: hsla(0, 90%, 55%, 1);
}

.map-gen-preview.areas .continentType-europe {
  background: hsla(25, 90%, 55%, 1);
}

.map-gen-preview.areas .continentType-mediterra {
  background: hsla(35, 90%, 55%, 1);
}

.map-gen-preview.areas .continentType-africa {
  background: hsla(45, 90%, 55%, 1);
}

.map-gen-preview.areas .continentType-levantica {
  background: hsla(55, 90%, 55%, 1);
}

.map-gen-preview.areas .continentType-siberia {
  background: hsla(70, 85%, 50%, 1);
}

.map-gen-preview.areas .continentType-asia {
  background: hsla(85, 75%, 48%, 1);
}

.map-gen-preview.areas .continentType-oceania {
  background: hsla(100, 70%, 45%, 1);
}

/****************************************
  * Oceans
  */

.map-gen-preview.areas .oceanType-arctic {
  background: hsla(190, 80%, 60%, 1);
}

.map-gen-preview.areas .oceanType-atlantic {
  background: hsla(200, 75%, 65%, 1);
}

.map-gen-preview.areas .oceanType-pacific {
  background: hsla(220, 75%, 65%, 1);
}

.map-gen-preview.areas .oceanType-indian {
  background: hsla(230, 80%, 62%, 1);
}

.map-gen-preview.areas .oceanType-antarctic {
  background: hsla(240, 85%, 60%, 1);
}

.map-gen-preview.areas .oceanType-caribbean {
  background: hsla(255, 80%, 62%, 1);
}

.map-gen-preview.areas .oceanType-mediterranean {
  background: hsla(265, 75%, 65%, 1);
}
</style>
