<script setup lang="ts">
import { computed, ref } from "vue";
import { capitalCase } from "change-case";
import UiTable, { TableColumn } from "@/components/Ui/UiTable.vue";
import { useObjectsStore } from "@/stores/objectStore";
import type { Player } from "@/objects/game/Player";
import { includes } from "@/helpers/textTools";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import { TypeKey } from "@/types/common";
import { TypeObject } from "@/types/typeObjects";

const objStore = useObjectsStore();

const players = objStore.getClassGameObjects("player") as Player[];

const current = ref<Player | null>(objStore.currentPlayer as Player);

function onRowClick(_e: unknown, payload: { item: unknown }) {
  current.value = payload.item as Player;
}

// Search predicate similar to CitiesTab.searchCity
function searchPlayer(p: Player, term: string): boolean {
  return (
    includes(p.name, term) ||
    includes(p.culture.value.type.value.name, term) ||
    includes(p.leader.value.name, term) ||
    includes(p.religion.value?.name ?? "", term)
  );
}

const columns = [
  { title: "Name", key: "name", value: (p: Player) => p.name },
  { title: "Culture", key: "culture", value: (p: Player) => p.culture.value.type.value.name },
  { title: "Leader", key: "leader", value: (p: Player) => p.leader.value.name },
  { title: "State Religion", key: "religion", value: (p: Player) => p.religion.value?.name ?? "-" },
  {
    title: "Agendas",
    key: "agendas",
    align: "end",
    value: (p: Player) => p.agendaKeys.value.length,
  },
  { title: "Deals", key: "deals", align: "end", value: (p: Player) => p.dealKeys.value.length },
  {
    title: "Trade Routes",
    key: "tradeRoutes",
    align: "end",
    value: (p: Player) => p.tradeRouteKeys.value.length,
  },
  { title: "Cities", key: "cities", align: "end", value: (p: Player) => p.cityKeys.value.length },
  { title: "Units", key: "units", align: "end", value: (p: Player) => p.unitKeys.value.length },
] as TableColumn<Player>[];

const typeTimeline = computed((): TypeObject[] => {
  if (!current.value) return [];

  const types = [] as TypeObject[];

  return types;
});
</script>

<template>
  <v-container class="pa-4" max-width="100%">
    <v-row class="ga-4">
      <!-- Left column: current selection -->
      <v-col>
        <template v-if="current">
          <h1 class="mb-4">{{ current.name }}</h1>

          <v-row class="ga-4">
            <!-- Leader -->
            <v-col>
              <div class="d-flex flex-column ga-3 align-start justify-center">
                <h2>
                  Leader
                  <UiObjectChip :type="current.leader" size="default" color="secondary" />
                </h2>
                <v-img
                  v-if="current.leader.image"
                  :src="current.leader.image"
                  :alt="current.leader.name + ' image'"
                  width="512"
                  class="rounded"
                  cover
                />
              </div>
            </v-col>

            <!-- Culture -->
            <v-col class="d-flex flex-column ga-4">
              <h2>
                Culture
                <template v-for="(type, i) in typeTimeline" :key="type.key">
                  <v-icon
                    v-if="i > 0"
                    icon="fa-arrow-right"
                    color="grey"
                    size="small"
                    class="ml-1"
                  />
                  <UiObjectChip :type="type" size="default" color="secondary" />
                </template>
              </h2>
              <v-row class="ga-2">
                <v-col>
                  <h3>Region</h3>
                  <UiObjectChip
                    :type="current.culture.region.value"
                    size="default"
                    color="secondary"
                  />
                  <UiObjectChip
                    :type="
                      useObjectsStore().getTypeObject(
                        ('continentType:' +
                          current.culture.type.value.category!.split(':')[1]) as TypeKey,
                      )
                    "
                    size="default"
                    color="secondary"
                  />
                  <div class="opacity-60 mt-1">{{ capitalCase(current.culture.status.value) }}</div>
                </v-col>
                <v-col>
                  <h3>Heritages</h3>
                  <UiObjectChips :types="current.culture.heritages.value" size="x-large" />
                  <div
                    v-if="current.culture.heritages.value.length === 0"
                    style="font-style: italic; opacity: 0.5"
                  >
                    None selected
                  </div>
                </v-col>
                <v-col>
                  <h3>Traits</h3>
                  <UiObjectChips :types="current.culture.traits.value" size="x-large" />
                  <div
                    v-if="current.culture.traits.value.length === 0"
                    style="font-style: italic; opacity: 0.5"
                  >
                    None selected
                  </div>
                </v-col>
              </v-row>
              <div>
                <h3>Yields</h3>
                <UiYields :yields="current.culture.yields.value" />
              </div>
            </v-col>
          </v-row>
        </template>
        <h1 v-else class="opacity-50">Select a player…</h1>
      </v-col>

      <!-- Right column: Players table -->
      <v-col>
        <UiTable
          :items="players"
          :columns="columns"
          :search="searchPlayer"
          item-key="key"
          hover
          title="Players"
          @click:row="onRowClick"
        >
          <template #[`item.name`]="{ item }">
            <div class="d-flex align-center ga-2">
              <span>{{ item.name }}</span>
              <v-icon v-if="item.isCurrent" icon="fa-star" color="amber" size="x-small" />
            </div>
          </template>
        </UiTable>
      </v-col>
    </v-row>
  </v-container>
</template>
