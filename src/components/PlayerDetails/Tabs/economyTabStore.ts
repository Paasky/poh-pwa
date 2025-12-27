import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import type { City } from "@/objects/game/City";

export const useEconomyTabStore = defineStore("economyTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  const headers = ref([{ title: "Source", key: "source" }]);

  const cities = computed<City[]>(() => objStore.currentPlayer.cities as City[]);

  function init() {
    if (initialized.value) return;

    // Warm up computed values
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    cities;

    initialized.value = true;
  }

  return { initialized, headers, cities, init };
});
