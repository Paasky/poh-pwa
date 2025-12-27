import { defineStore } from "pinia";
import { computed, markRaw, reactive, ref, shallowRef } from "vue";
import type { WorldSize } from "@/factories/worldFactory";
import { worldSizes } from "@/factories/worldFactory";
import { TerraGenerator } from "@/factories/TerraGenerator/terra-generator";
import { useObjectsStore } from "@/stores/objectStore";
import { GenTile } from "@/factories/TerraGenerator/gen-tile";

export type AlignmentValue = {
  mirrorX: boolean | null;
  mirrorY: boolean | null;
  mirrorClimate: boolean | null;
};

type Toggles = {
  showTerrain: boolean;
  showElevation: boolean;
  showFeatures: boolean;
  showMajorStarts: boolean;
  showFreshSalt: boolean;
  showAreas: boolean;
  showRivers: boolean;
};

type SizeOption = { label: string; value: { x: number; y: number } };

function mapConfig() {
  return {
    continents: { min: 4, max: 10 },
    majorsPerContinent: { min: 1, max: 4 },
    minorsPerPlayer: { min: 0, max: 2 },

    // x & y size to fit everyone on land, plus the same amount of water
    getSize: (
      continents: 4 | 5 | 6 | 7 | 8 | 9 | 10,
      majorsPerContinent: 1 | 2 | 3 | 4,
      minorsPerPlayer: 0 | 1 | 2,
    ): WorldSize => {
      // City area = 61 (4-radius)
      // 5 cities per major + 1 per minor
      // * 2 for oceans
      // = 2440 to 34 160 tiles
      const majors = majorsPerContinent * continents;
      const minors = majors * minorsPerPlayer;
      const cities = majors * 5 + minors;
      const minSize = 61 * cities * 2;

      // Find a map x & y that fits the min size (x increments by 8)
      // Start with the smallest size 72x36 = 2 592 tiles up to 270x135 = 36 450 tiles
      let ySize = 36;
      while (true) {
        if (ySize * 2 * ySize >= minSize)
          return {
            name: "Custom",
            x: ySize * 2,
            y: ySize,
            continents,
            majorsPerContinent,
            minorsPerPlayer,
          };
        ySize = ySize + 8;
      }
    },

    // Very rough estimate of memory usage for a given map size
    getMemReq: (
      continents: 4 | 5 | 6 | 7 | 8 | 9 | 10,
      majorsPerContinent: 1 | 2 | 3 | 4,
      minorsPerPlayer: 0 | 1 | 2,
    ): {
      minMB: number;
      maxMB: number;
      cpuImpact: 1 | 2 | 3 | 4 | 5;
    } => {
      const majors = majorsPerContinent * continents;
      const minors = majors * minorsPerPlayer;
      const cities = majors * 5 + minors;
      const tiles = 61 * cities * 2;
      const citizens = cities * 50;
      const constructions = cities * 20;
      const players = majors + minors;
      const religions = Math.ceil(majors / 2);
      const units = players * 25;
      const unitDesigns = players * 10;

      const watchers =
        tiles * 4 +
        players * (8 + 6 + 12 + 2) +
        cities * 9 +
        citizens * 9 +
        constructions * 5 +
        units * 9 +
        unitDesigns * 2 +
        religions * 4;

      const refs =
        tiles * 5 +
        players * (6 + 6 + 5 + 5) +
        cities * 9 +
        citizens * 7 +
        constructions * 7 +
        units * 7 +
        unitDesigns * 2 +
        religions * 3;

      const staticData = 7 * 1024 * 1024;

      const minMB = Math.round((watchers * 256 + refs * 64 + staticData) / (1024 * 1024));
      const maxMB = Math.round((watchers * 1024 + refs * 512 + staticData) / (1024 * 1024));

      return {
        minMB,
        maxMB,
        cpuImpact: Math.min(5, Math.ceil(maxMB / 100)) as 1 | 2 | 3 | 4 | 5,
      };
    },
  };
}

export const useMapGenStore = defineStore("mapGen", () => {
  const objStore = useObjectsStore();
  const worldConfig = mapConfig();

  // Core state
  const worldValues = ref<WorldSize>({
    name: "Terra",
    x: 28 * 9,
    y: 14 * 9,
    continents: 10,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
  });

  const alignmentOptions: { label: string; value: AlignmentValue }[] = [
    {
      label: "Earth-like",
      value: { mirrorX: false, mirrorY: false, mirrorClimate: false },
    },
    {
      label: "Mirror Latitude",
      value: { mirrorX: false, mirrorY: true, mirrorClimate: true },
    },
    {
      label: "Mirror Longitude",
      value: { mirrorX: true, mirrorY: false, mirrorClimate: false },
    },
    {
      label: "Mirror Both",
      value: { mirrorX: true, mirrorY: true, mirrorClimate: true },
    },
    {
      label: "Random",
      value: { mirrorX: null, mirrorY: null, mirrorClimate: null },
    },
  ];
  const alignment = ref<AlignmentValue>(alignmentOptions[0].value);

  const toggles = reactive<Toggles>({
    showTerrain: true,
    showElevation: true,
    showFeatures: true,
    showMajorStarts: true,
    showFreshSalt: false,
    showAreas: false,
    showRivers: true,
  });

  const selectedLevel = ref<"strat" | "reg" | "game">("strat");

  const gen = shallowRef<TerraGenerator | null>(null);

  // Options for dropdowns
  const sizeOptions = computed<SizeOption[]>(() => {
    const ys = worldSizes.map((ws) => ws.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const opts: SizeOption[] = [];
    const presetByY = Object.fromEntries(worldSizes.map((ws) => [ws.y, ws])) as Record<
      number,
      WorldSize
    >;
    for (let y = minY; y <= maxY; y += 9) {
      const x = y * 2;
      const preset = presetByY[y];
      const label = preset ? `${preset.name} (${x}×${y})` : `${x}×${y}`;
      opts.push({ label, value: { x, y } });
    }
    return opts;
  });

  const memInfo = computed(() => {
    const { minMB, maxMB, cpuImpact } = worldConfig.getMemReq(
      worldValues.value.continents,
      worldValues.value.majorsPerContinent,
      worldValues.value.minorsPerPlayer,
    );
    const cpuLabels = ["tiny", "low", "some", "medium", "high"] as const;
    const cpu = cpuLabels[cpuImpact - 1];
    return { minMB, maxMB, cpu };
  });

  const continentsOptions = [
    { label: "10", value: 10 },
    { label: "9", value: 9 },
    { label: "8", value: 8 },
    { label: "7", value: 7 },
    { label: "6", value: 6 },
    { label: "5", value: 5 },
    { label: "4", value: 4 },
  ];
  const majorsOptions = [
    { label: "4", value: 4 },
    { label: "3", value: 3 },
    { label: "2", value: 2 },
    { label: "1", value: 1 },
  ];
  const minorsOptions = [
    { label: "2", value: 2 },
    { label: "1", value: 1 },
    { label: "0", value: 0 },
  ];

  // Render helpers
  const renderTiles = computed(() => {
    const out = {
      strat: [] as GenTile[][],
      reg: [] as GenTile[][],
      game: [] as GenTile[][],
    };
    if (!gen.value) return out;
    for (const t of Object.values(gen.value.stratTiles)) {
      out.strat[t.y] = out.strat[t.y] || [];
      out.strat[t.y][t.x] = t;
    }
    for (const t of Object.values(gen.value.regTiles)) {
      out.reg[t.y] = out.reg[t.y] || [];
      out.reg[t.y][t.x] = t;
    }
    for (const t of Object.values(gen.value.gameTiles)) {
      out.game[t.y] = out.game[t.y] || [];
      out.game[t.y][t.x] = t;
    }
    return out;
  });

  const stratSize = computed(() => gen.value?.stratSize ?? { x: 0, y: 0 });
  const regSize = computed(() => gen.value?.regSize ?? { x: 0, y: 0 });
  const gameSize = computed(() => gen.value?.size ?? { x: 0, y: 0 });

  const areaColors = reactive<Record<string, string>>({});

  const terrainTypes = computed(() =>
    [...objStore.getClassTypes("terrainType")].sort((a, b) => a.name.localeCompare(b.name)),
  );
  const elevationTypes = computed(() =>
    [...objStore.getClassTypes("elevationType")]
      .filter((e) => e.id !== "flat")
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  const featureTypes = computed(() =>
    [...objStore.getClassTypes("featureType")].sort((a, b) => a.name.localeCompare(b.name)),
  );

  // Actions
  function updateWorld<K extends keyof WorldSize>(key: K, value: WorldSize[K]) {
    worldValues.value = {
      ...worldValues.value,
      [key]: value,
    } as WorldSize;
  }

  function updateSize(v: { x: number; y: number }) {
    const next: WorldSize = { ...worldValues.value, x: v.x, y: v.y };
    const nearest = [...worldSizes].sort((a, b) => Math.abs(a.y - v.y) - Math.abs(b.y - v.y))[0];
    if (nearest) {
      next.continents = nearest.continents;
      next.majorsPerContinent = nearest.majorsPerContinent;
      next.minorsPerPlayer = nearest.minorsPerPlayer;
    }
    worldValues.value = next;
  }

  function setAlignment(value: AlignmentValue) {
    alignment.value = value;
  }

  function toggle(key: keyof Toggles) {
    toggles[key] = !toggles[key];
  }

  function generate() {
    objStore.resetGame();

    const ax = alignment.value.mirrorX === null ? Math.random() < 0.5 : alignment.value.mirrorX;
    const ay = alignment.value.mirrorY === null ? Math.random() < 0.5 : alignment.value.mirrorY;
    const ac = alignment.value.mirrorClimate === null ? Math.random() < 0.5 : alignment.value.mirrorClimate;
    gen.value = markRaw(
      new TerraGenerator(worldValues.value, ax, ay, ac)
        .generateStratLevel()
        .generateRegLevel()
        .generateGameLevel(),
    );
  }

  return {
    init: () => {
      gen.value = markRaw(new TerraGenerator(worldValues.value));
    },
    // state
    worldValues,
    alignment,
    alignmentOptions,
    toggles,
    selectedLevel,
    gen,
    areaColors,

    // options
    sizeOptions,
    memInfo,
    continentsOptions,
    majorsOptions,
    minorsOptions,

    // derived
    renderTiles,
    stratSize,
    regSize,
    gameSize,
    terrainTypes,
    elevationTypes,
    featureTypes,

    // actions
    updateWorld,
    updateSize,
    setAlignment,
    toggle,
    generate,
  };
});
