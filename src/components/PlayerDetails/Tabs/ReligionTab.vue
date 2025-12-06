<script setup lang="ts">
import { formatYear, getYearFromTurn } from "@/types/common";
import { ref } from "vue";
import { Religion } from "@/objects/game/Religion";
import UiCols from "@/components/Ui/UiCols.vue";
import UiTable from "@/components/Ui/UiTable.vue";
import { includes } from "@/helpers/textTools";
import ReligionTabPyramid from "@/components/PlayerDetails/Tabs/ReligionTabPyramid.vue";
import { useReligionTabStore } from "@/components/PlayerDetails/Tabs/religionTabStore";

const store = useReligionTabStore();

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

const current = ref<Religion | null>(store.defaultCurrent as Religion | null);
</script>

<template>
  <UiCols :cols="{ left: 3, right: 9 }">
    <template #left>
      <UiTable
        title="Religions"
        :columns="store.columns"
        :items="store.religions"
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
          {{ Math.round((current.citizenKeys.length / store.citizensCount) * 100) }}% of world
          population
        </div>

        <ReligionTabPyramid
          title="Mythology"
          :cat-pyramid="store.mythData as any"
          :current="current as any as Religion"
        />

        <ReligionTabPyramid
          title="Gods"
          :cat-pyramid="store.godData as any"
          :current="current as any as Religion"
        />

        <ReligionTabPyramid
          title="Dogmas"
          :cat-pyramid="store.dogmaData as any"
          :current="current as any as Religion"
        />
      </div>
    </template>
  </UiCols>
</template>
