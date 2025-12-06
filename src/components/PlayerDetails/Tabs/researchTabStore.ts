import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import type { TypeObject } from "@/types/typeObjects";

export const useResearchTabStore = defineStore("researchTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  const techs = ref<TypeObject[]>([]);
  const eras = ref<TypeObject[]>([]);

  const player = computed(() => objStore.currentPlayer);
  const research = computed(() => player.value.research);

  const maxY = computed(() => (techs.value.length ? Math.max(...techs.value.map((t) => t.y!)) : 0));
  const maxX = computed(() => (techs.value.length ? Math.max(...techs.value.map((t) => t.x!)) : 0));

  function init() {
    if (initialized.value) return;
    techs.value = objStore.getClassTypes("technologyType");
    eras.value = objStore.getClassTypes("eraType");
    initialized.value = true;
  }

  return { initialized, techs, eras, player, research, maxX, maxY, init };
});
