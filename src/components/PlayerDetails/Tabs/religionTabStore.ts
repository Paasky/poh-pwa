import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import type { Religion } from "@/objects/game/Religion";
import type { CatKey } from "@/types/common";
import { generateKey } from "@/objects/game/_GameObject";

export const useReligionTabStore = defineStore("religionTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  // Table columns (kept empty per current implementation)
  const columns = ref<any[]>([]);

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

  const religions = computed(() => objStore.getClassGameObjects("religion") as Religion[]);
  const citizensCount = computed(() => objStore.getClassGameObjects("citizen").length);

  const defaultCurrent = computed<Religion | null>(() => {
    const firstCity = objStore.getClassGameObjects("city")[0];
    if (!firstCity) return null;
    // Construct a placeholder religion as in component
    // name and turn are placeholders
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new (require("@/objects/game/Religion").Religion)(
      generateKey("religion"),
      "Zoroastrianism",
      firstCity.key,
      84,
    ) as Religion;
  });

  function init() {
    if (initialized.value) return;
    religions.value;
    citizensCount.value;
    defaultCurrent.value;
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
