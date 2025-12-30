import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { City } from "@/Common/Models/City";
import { useCurrentContext } from "@/composables/useCurrentContext";

export const useEconomyTabStore = defineStore("economyTabStore", () => {
  const initialized = ref(false);

  const headers = ref([{ title: "Source", key: "source" }]);

  const cities = computed<City[]>(() => useCurrentContext().currentPlayer.cities);

  function init() {
    if (initialized.value) return;

    // Warm up computed values
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    cities;

    initialized.value = true;
  }

  return { initialized, headers, cities, init };
});
