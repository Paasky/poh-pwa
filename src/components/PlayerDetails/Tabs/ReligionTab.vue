<script setup lang="ts">
import { useObjectsStore } from "@/stores/objectStore";
import { CatKey, formatYear, getYearFromTurn } from "@/types/common";
import { computed, ref } from "vue";
import { Religion } from "@/objects/game/Religion";
import UiCols from "@/components/Ui/UiCols.vue";
import UiTable from "@/components/Ui/UiTable.vue";
import { includes } from "@/helpers/textTools";
import { generateKey } from "@/objects/game/_GameObject";
import ReligionTabPyramid from "@/components/PlayerDetails/Tabs/ReligionTabPyramid.vue";

const objStore = useObjectsStore();

// Static data for left column
const columns = [];

// Static data for right column
const mythData = [
  ["mythCategory:creation"],
  ["mythCategory:stars", "mythCategory:humans", "mythCategory:death"],
  // eslint-disable-next-line
] as any as CatKey[][];

const godData = [
  ["godCategory:kingOfGods", "godCategory:godMother"],
  ["godCategory:godOfTheSea", "godCategory:godOfFertility", "godCategory:godOfTheMoon"],
  [
    "godCategory:godOfFishing",
    "godCategory:godOfHunting",
    "godCategory:godOfTheHarvest",
    "godCategory:godOfFire",
  ],
  // eslint-disable-next-line
] as any as CatKey[][];

const dogmaData = [
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
  // eslint-disable-next-line
] as any as CatKey[][];

const religions = computed(() => objStore.getClassGameObjects("religion") as Religion[]);

function searchReligion(rel: Religion, term: string): boolean {
  return (
    includes(rel.name, term) ||
    includes(rel.city.value.name.value, term) ||
    rel.players.value.some((p) => includes(p.name, term))
  );
}

function onRowClick(_e: unknown, payload: { item: unknown }) {
  current.value = payload.item as Religion;
}

const current = ref<Religion | null>(
  objStore.getClassGameObjects("city")[0]
    ? new Religion(
        generateKey("religion"),
        "Zoroastrianism",
        objStore.getClassGameObjects("city")[0].key,
        84,
      )
    : null,
);
</script>

<template>
  <UiCols :cols="{ left: 3, right: 9 }">
    <template #left>
      <UiTable
        title="Religions"
        :columns="columns"
        :items="religions"
        :search="searchReligion"
        @click:row="onRowClick"
        :hover="true"
      />
    </template>
    <template #right>
      <div v-if="current">
        <h1>{{ current.name }}</h1>
        <div>
          Founded {{ formatYear(getYearFromTurn(current.foundedTurn)) }} in {{ current.city.name }}
        </div>
        <div>
          {{ current.citizenKeys.length }} followers,
          {{
            Math.round(
              (current.citizenKeys.length / objStore.getClassGameObjects("citizen").length) * 100,
            )
          }}% of world population
        </div>

        <ReligionTabPyramid
          title="Mythology"
          :cat-pyramid="mythData"
          :current="current as any as Religion"
        />

        <ReligionTabPyramid
          title="Gods"
          :cat-pyramid="godData"
          :current="current as any as Religion"
        />

        <ReligionTabPyramid
          title="Dogmas"
          :cat-pyramid="dogmaData"
          :current="current as any as Religion"
        />
      </div>
    </template>
  </UiCols>
</template>
