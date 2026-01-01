import pkg from "../../package.json";
import { defineStore } from "pinia";
import { WorldSize, worldSizes } from "@/factories/worldFactory";
import { loadFromBrowser, saveToBrowser } from "@/utils/persistentStorage";
import { WorldState } from "@/Common/Objects/Common";

const STORAGE_KEY = "poh.mapgen.config";
const STORAGE_VERSION = pkg.version;

export type AlignmentLabel = "Earth-like" | "Mirror X" | "Mirror Y" | "Mirror Both" | "Random";

export interface MapGenConfig {
  size: WorldSize;
  alignment: AlignmentLabel;
  continents: number;
  majorsPerContinent: number;
  minorsPerPlayer: number;
  worldState: Partial<WorldState>;
}

const alignmentPresets: Record<
  Exclude<AlignmentLabel, "Random">,
  { flipX: boolean; flipY: boolean; flipClimate: boolean }
> = {
  "Earth-like": { flipX: false, flipY: false, flipClimate: false },
  "Mirror X": { flipX: true, flipY: false, flipClimate: false },
  "Mirror Y": { flipX: false, flipY: true, flipClimate: true },
  "Mirror Both": { flipX: true, flipY: true, flipClimate: true },
};

export const useMapGenStore = defineStore("mapGen", {
  state: () => ({
    config: {
      size: worldSizes[2], // Default Regular
      alignment: "Earth-like",
      continents: worldSizes[2].continents,
      majorsPerContinent: worldSizes[2].majorsPerContinent,
      minorsPerPlayer: worldSizes[2].minorsPerPlayer,
      worldState: {
        id: crypto.randomUUID(),
        size: worldSizes[2],
        turn: 0,
        year: -10000,
      } as Partial<WorldState>,
    } as MapGenConfig,
  }),
  actions: {
    init() {
      const cached = loadFromBrowser<MapGenConfig>(STORAGE_KEY, STORAGE_VERSION);
      if (cached) {
        this.config = cached;
      }

      this.$subscribe(() => {
        saveToBrowser(STORAGE_KEY, STORAGE_VERSION, this.config);
      });
    },
    getResolvedConfig() {
      if (this.config.alignment === "Random") {
        return {
          ...this.config,
          flipX: Math.random() < 0.5,
          flipY: Math.random() < 0.5,
          flipClimate: Math.random() < 0.5,
        };
      }
      return { ...this.config, ...alignmentPresets[this.config.alignment] };
    },
  },
});
