import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import type { City } from "@/objects/game/City";

export const useCitiesTabStore = defineStore("citiesTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  const cities = computed<City[]>(() => objStore.currentPlayer.cities as City[]);

  // Column definitions are fairly UI-specific; keep data here per requirement
  const columns = ref([
    { title: "Name", key: "name", value: (c: City) => c.name },
    { title: "Health", key: "health", align: "end", value: (c: City) => c.health },
    { title: "Yields", key: "yields" },
    { title: "Constructing", key: "constructing" },
    { title: "Training", key: "training" },
    { title: "Details", key: "details" },
  ]);

  function init() {
    if (initialized.value) return;

    // Warm up computed values
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    cities;

    initialized.value = true;
  }

  return { initialized, cities, columns, init };
});
