<script setup lang="ts">
import { formatYear, getYearFromTurn } from "@/Common/Objects/Common";
import { ref } from "vue";
import { Religion } from "@/Common/Models/Religion";
import UiCols from "@/App/components/Ui/UiCols.vue";
import UiTable from "@/App/components/Ui/UiTable.vue";
import { includes } from "@/Common/Helpers/textTools";
import ReligionTabPyramid from "@/App/components/PlayerDetails/Tabs/ReligionTabPyramid.vue";
import { useReligionTabStore } from "@/App/components/PlayerDetails/Tabs/religionTabStore";

const store = useReligionTabStore();

function searchReligion(rel: Religion, term: string): boolean {
  return (
    includes(rel.name, term) ||
    includes(rel.city.name, term) ||
    rel.players.some((p) => includes(p.name, term))
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
          {{ current.citizenKeys.size }} followers,
          {{ Math.round((current.citizenKeys.size / store.citizensCount) * 100) }}% of world
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
