import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import type { City } from "@/Common/Models/City";

export const useEconomyTabStore = defineStore("economyTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  const headers = ref([{ title: "Source", key: "source" }]);

  const cities = computed<City[]>(() => useCurrentContext().currentPlayer.cities as City[]);

  function init() {
    if (initialized.value) return;

    // Warm up computed values
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    cities;

    initialized.value = true;
  }

  return { initialized, headers, cities, init };
});
