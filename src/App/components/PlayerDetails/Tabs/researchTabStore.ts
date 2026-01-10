/* eslint-disable @typescript-eslint/no-unused-expressions */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import type { TypeObject } from "@/Common/Objects/TypeObject";
import { useCurrentContext } from "@/Common/composables/useCurrentContext";

export const useResearchTabStore = defineStore("researchTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  const techs = ref<Set<TypeObject>>([]);
  const eras = ref<Set<TypeObject>>([]);

  const player = computed(() => useCurrentContext().currentPlayer);
  const research = computed(() => player.value.research);

  const maxX = computed(() => Math.max(...techs.value.map((t) => t.x!)));
  const maxY = computed(() => Math.max(...techs.value.map((t) => t.y!)));

  function init() {
    if (initialized.value) return;
    techs.value = Array.from(bucket.getClassTypes("technologyType"));
    eras.value = Array.from(bucket.getClassTypes("eraType"));

    // Warm up computed values
    player;
    research;
    maxX;
    maxY;

    initialized.value = true;
  }

  return { initialized, techs, eras, player, research, maxX, maxY, init };
});
