<script setup lang="ts">
import { onMounted } from "vue";
import UiCols from "@/components/Ui/UiCols.vue";
import { Tile } from "@/Common/Models/Tile";
import { useObjectsStore } from "@/stores/objectStore";
import { StaticData } from "@/types/api";
import { fetchJSON, useAppStore } from "@/stores/appStore";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { PohEngine } from "@/engine/PohEngine";
import GameMenu from "@/components/GameView/GameMenu.vue";

// Init static data
const objStore = useObjectsStore();

// Init engine
let engine: PohEngine | null = null;
const appStore = useAppStore();
onMounted(async () => {
  objStore.initStatic(await fetchJSON<StaticData>("/staticData.json"));

  const land = objStore.getTypeObject("domainType:land");
  const water = objStore.getTypeObject("domainType:water");

  const ocean = objStore.getTypeObject("terrainType:ocean");
  const sea = objStore.getTypeObject("terrainType:sea");
  const coast = objStore.getTypeObject("terrainType:coast");
  const lake = objStore.getTypeObject("terrainType:lake");
  const majorRiver = objStore.getTypeObject("terrainType:majorRiver");
  const grass = objStore.getTypeObject("terrainType:grass");
  const tundra = objStore.getTypeObject("terrainType:tundra");

  const flat = objStore.getTypeObject("elevationType:flat");
  const hill = objStore.getTypeObject("elevationType:hill");
  const mountain = objStore.getTypeObject("elevationType:mountain");
  const snowMountain = objStore.getTypeObject("elevationType:snowMountain");

  const pineForest = objStore.getTypeObject("featureType:pineForest");
  const forest = objStore.getTypeObject("featureType:forest");
  const jungle = objStore.getTypeObject("featureType:jungle");
  const shrubs = objStore.getTypeObject("featureType:shrubs");
  const swamp = objStore.getTypeObject("featureType:swamp");

  // Init test world
  const tile = (
    x: number,
    y: number,
    opts: {
      domain?: TypeObject;
      area?: TypeObject;
      climate?: TypeObject;
      terrain?: TypeObject;
      elevation?: TypeObject;
      feature?: TypeObject;
      resource?: TypeObject;
      naturalWonder?: TypeObject;
    } = {},
  ): Tile =>
    new Tile(
      Tile.getKey(x, y),
      x,
      y,
      opts.domain ?? land,
      opts.area ?? objStore.getTypeObject("continentType:taiga"),
      opts.climate ?? objStore.getTypeObject("climateType:temperate"),
      opts.terrain ?? grass,
      opts.elevation ?? flat,
      opts.feature ?? null,
      opts.resource ?? null,
      opts.naturalWonder ?? null,
    );
  const objs = [
    tile(0, 0, { domain: water, terrain: ocean }),
    tile(0, 1, { domain: water, terrain: sea }),
    tile(0, 2, { elevation: hill }),
    tile(0, 3, { elevation: mountain }),
    tile(0, 4, {}),
    tile(0, 5, { elevation: mountain }),
    tile(0, 6, { elevation: hill }),
    tile(0, 7, {}),
    tile(0, 8, {}),
    tile(0, 9, {}),
    tile(0, 10, {}),
    tile(0, 11, {}),

    tile(1, 0, { terrain: tundra }),
    tile(1, 1, { terrain: tundra, elevation: hill }),
    tile(1, 2, { domain: water, terrain: coast }),
    tile(1, 3, { domain: water, terrain: majorRiver }),
    tile(1, 4, { elevation: snowMountain }),
    tile(1, 5, { domain: water, terrain: majorRiver }),
    tile(1, 6, { domain: water, terrain: majorRiver }),
    tile(1, 7, { elevation: hill }),
    tile(1, 8, {}),
    tile(1, 9, {}),
    tile(1, 10, {}),
    tile(1, 11, {}),

    tile(2, 0, {}),
    tile(2, 1, {}),
    tile(2, 2, { terrain: tundra, elevation: mountain }),
    tile(2, 3, { terrain: tundra, elevation: snowMountain }),
    tile(2, 4, { domain: water, terrain: lake }),
    tile(2, 5, { elevation: snowMountain }),
    tile(2, 6, { elevation: mountain }),
    tile(2, 7, { feature: pineForest }),
    tile(2, 8, {}),
    tile(2, 9, {}),
    tile(2, 10, {}),
    tile(2, 11, {}),

    tile(3, 0, {}),
    tile(3, 1, {}),
    tile(3, 2, {}),
    tile(3, 3, { elevation: mountain }),
    tile(3, 4, { domain: water, terrain: majorRiver }),
    tile(3, 5, { elevation: mountain }),
    tile(3, 6, { feature: forest }),
    tile(3, 7, { feature: jungle }),
    tile(3, 8, {}),
    tile(3, 9, {}),
    tile(3, 10, {}),
    tile(3, 11, {}),

    tile(4, 0, {}),
    tile(4, 1, {}),
    tile(4, 2, {}),
    tile(4, 3, { elevation: hill }),
    tile(4, 4, { domain: water, terrain: majorRiver }),
    tile(4, 5, { elevation: hill }),
    tile(4, 6, { feature: shrubs }),
    tile(4, 7, { feature: swamp }),
    tile(4, 8, {}),
    tile(4, 9, {}),
    tile(4, 10, {}),
    tile(4, 11, {}),

    tile(5, 0, {}),
    tile(5, 1, {}),
    tile(5, 2, {}),
    tile(5, 3, {}),
    tile(5, 4, { domain: water, terrain: majorRiver }),
    tile(5, 5, {}),
    tile(5, 6, {}),
    tile(5, 7, {}),
    tile(5, 8, {}),
    tile(5, 9, {}),
    tile(5, 10, {}),
    tile(5, 11, {}),

    tile(6, 0, {}),
    tile(6, 1, {}),
    tile(6, 2, {}),
    tile(6, 3, {}),
    tile(6, 4, {}),
    tile(6, 5, {}),
    tile(6, 6, {}),
    tile(6, 7, {}),
    tile(6, 8, {}),
    tile(6, 9, {}),
    tile(6, 10, {}),
    tile(6, 11, {}),

    tile(7, 0),
    tile(7, 1),
    tile(7, 2),
    tile(7, 3),
    tile(7, 4),
    tile(7, 5),
    tile(7, 6),
    tile(7, 7),
    tile(7, 8),
    tile(7, 9),
    tile(7, 10),
    tile(7, 11),

    tile(8, 0),
    tile(8, 1),
    tile(8, 2),
    tile(8, 3),
    tile(8, 4),
    tile(8, 5),
    tile(8, 6),
    tile(8, 7),
    tile(8, 8),
    tile(8, 9),
    tile(8, 10),
    tile(8, 11),

    tile(9, 0),
    tile(9, 1),
    tile(9, 2),
    tile(9, 3),
    tile(9, 4),
    tile(9, 5),
    tile(9, 6),
    tile(9, 7),
    tile(9, 8),
    tile(9, 9),
    tile(9, 10),
    tile(9, 11),

    tile(10, 0),
    tile(10, 1),
    tile(10, 2),
    tile(10, 3),
    tile(10, 4),
    tile(10, 5),
    tile(10, 6),
    tile(10, 7),
    tile(10, 8),
    tile(10, 9),
    tile(10, 10),
    tile(10, 11),

    tile(11, 0),
    tile(11, 1),
    tile(11, 2),
    tile(11, 3),
    tile(11, 4),
    tile(11, 5),
    tile(11, 6),
    tile(11, 7),
    tile(11, 8),
    tile(11, 9),
    tile(11, 10),
    tile(11, 11),
  ];

  objStore.bulkSet(objs);
  objStore.world = {
    id: "test",
    size: { x: 12, y: 12 },
    turn: 0,
    year: 0,
    currentPlayer: "player:1",
  };

  const engineCanvas = document.getElementById("engine-canvas") as HTMLCanvasElement | null;
  if (!engineCanvas) throw new Error("PohEngine canvas `#engine-canvas` not found");
  engine = new PohEngine(objStore.world.size, engineCanvas);
  // Expose the engine to the GameMenu via the app store so options can be applied in TestView
  appStore.engineService = engine;
});

function onReload() {
  // Minimal reload handler for TestView
  document.location.reload();
}

function onQuit() {
  // Navigate home in this test harness
  document.location.href = "/";
}
</script>

<template>
  <UiCols :cols="{ left: 3, right: 9 }">
    <template #left>
      <div class="d-flex align-center justify-space-between">
        <h1>Test</h1>
        <!-- Game menu (top-right of the left pane for convenience) -->
        <GameMenu @reload="onReload" @quit="onQuit" />
      </div>
    </template>
    <template #right>
      <canvas id="engine-canvas"></canvas>
    </template>
  </UiCols>
</template>

<style scoped>
/* Make the canvas fill its container */
#engine-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
