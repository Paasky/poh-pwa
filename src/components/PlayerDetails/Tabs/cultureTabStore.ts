import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { CatData, useObjectsStore } from "@/stores/objectStore";

export const useCultureTabStore = defineStore("cultureTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  const heritageCats = ref<CatData[]>([]);
  const traitCats = ref<CatData[]>([]);

  const culture = computed(() => objStore.currentPlayer.culture.value);

  function init() {
    if (initialized.value) return;
    heritageCats.value = objStore.getClassTypesPerCategory("heritageType");
    traitCats.value = objStore.getClassTypesPerCategory("traitType");

    // Warm up computed values
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    culture.value;

    initialized.value = true;
  }

  return { initialized, heritageCats, traitCats, culture, init };
});
