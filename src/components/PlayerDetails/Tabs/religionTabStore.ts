/* eslint-disable @typescript-eslint/no-unused-expressions */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import { Religion } from "@/Common/Models/Religion";
import type { CatKey } from "@/Common/Objects/Common";
import { generateKey } from "@/Common/Models/_GameModel";

export const useReligionTabStore = defineStore("religionTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  // Table columns (kept empty per current implementation)
  const columns = ref<never[]>([]);

  // Static pyramid data
  const mythData = ref<CatKey[][]>([
    ["mythCategory:creation"],
    ["mythCategory:stars", "mythCategory:humans", "mythCategory:death"],
  ] as unknown as CatKey[][]);

  const godData = ref<CatKey[][]>([
    ["godCategory:kingOfGods", "godCategory:godMother"],
    ["godCategory:godOfTheSea", "godCategory:godOfFertility", "godCategory:godOfTheMoon"],
    [
      "godCategory:godOfFishing",
      "godCategory:godOfHunting",
      "godCategory:godOfTheHarvest",
      "godCategory:godOfFire",
    ],
  ] as unknown as CatKey[][]);

  const dogmaData = ref<CatKey[][]>([
    ["dogmaCategory:gods"],
    ["dogmaCategory:authority", "dogmaCategory:afterlife"],
    ["dogmaCategory:support", "dogmaCategory:outreach", "dogmaCategory:deathRites"],
    [
      "dogmaCategory:practice",
      "dogmaCategory:devotion",
      "dogmaCategory:belief",
      "dogmaCategory:monuments",
    ],
    [
      "dogmaCategory:expression",
      "dogmaCategory:journey",
      "dogmaCategory:identity",
      "dogmaCategory:texts",
      "dogmaCategory:service",
    ],
  ] as unknown as CatKey[][]);

  const religions = computed(() => bucket.getClassGameObjects("religion") as Religion[]);
  const citizensCount = computed(() => bucket.getClassGameObjects("citizen").length);

  const defaultCurrent = computed<Religion | null>(() => {
    const firstCity = bucket.getClassGameObjects("city")[0];
    if (!firstCity) return null;
    // Construct a placeholder religion as in component
    // name and turn are placeholders
    return new Religion(generateKey("religion"), "Zoroastrianism", firstCity.key, 84) as Religion;
  });

  function init() {
    if (initialized.value) return;

    // Warm up computed values
    religions;
    citizensCount;
    defaultCurrent;

    initialized.value = true;
  }

  return {
    initialized,
    columns,
    mythData,
    godData,
    dogmaData,
    religions,
    citizensCount,
    defaultCurrent,
    init,
  };
});
