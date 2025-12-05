<script setup lang="ts">
import { computed, ref } from "vue";
import UiTable, { TableColumn } from "@/components/Ui/UiTable.vue";
import { useObjectsStore } from "@/stores/objectStore";
import type { Player } from "@/objects/game/Player";
import { includes } from "@/helpers/textTools";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import { TypeKey } from "@/types/common";
import UiCols from "@/components/Ui/UiCols.vue";
import { TypeObject, typeTimeline } from "@/types/typeObjects";

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

const cultureTimeline = computed(() => {
  if (!current.value?.culture.type.value) return [];

  return typeTimeline(current.value.culture.type.value as TypeObject);
});
const leaderTimeline = computed(() => {
  return cultureTimeline.value.map((c) =>
    useObjectsStore().getTypeObject(c.allows.find((a) => a.startsWith("majorLeaderType:"))!),
  );
});
</script>

<template>
  <UiCols>
    <template #left>
      <UiTable
        title="Players"
        :items="players"
        :columns="columns"
        :search="searchPlayer"
        @click:row="onRowClick"
        :hover="true"
      >
        <template #[`item.name`]="{ item }">
          <div class="d-flex align-center ga-2">
            <span>{{ (item as Player).name }}</span>
            <v-icon v-if="(item as Player).isCurrent" icon="fa-star" color="amber" size="x-small" />
          </div>
        </template>
      </UiTable>
    </template>
    <template #right>
      <div v-if="current" class="d-flex flex-column ga-6">
        <!-- Leader -->
        <div class="d-flex flex-column ga-4">
          <h2>Leader</h2>
          <div class="d-flex align-center ga-2" style="font-size: 1rem">
            <template v-for="(type, i) in leaderTimeline" :key="type.key">
              <v-icon v-if="i > 0" icon="fa-chevron-right" color="grey" size="x-small" />
              <UiObjectChip
                :type="type"
                :size="current.leader.key === type.key ? 'large' : 'x-small'"
                color="secondary"
              />
            </template>
          </div>
          <v-img
            v-if="current.leader.image"
            :src="current.leader.image"
            :alt="current.leader.name + ' image'"
            width="512"
            class="rounded"
            cover
          />
        </div>

        <!-- Culture -->
        <div class="d-flex flex-column ga-4">
          <h2>Culture</h2>
          <div class="d-flex align-center ga-2" style="font-size: 1rem">
            <template v-for="(type, i) in cultureTimeline" :key="type.key">
              <v-icon v-if="i > 0" icon="fa-chevron-right" color="grey" size="x-small" />
              <UiObjectChip
                :type="type"
                :size="current.culture.type.value.key === type.key ? 'large' : 'x-small'"
                color="secondary"
              />
            </template>
          </div>

          <!-- Sub Headers -->
          <div class="d-flex ga-2">
            <div class="flex-grow-1">
              <h3 class="mb-2">Region</h3>
              <UiObjectChip :type="current.culture.region.value" size="small" color="secondary" />
              <UiObjectChip
                :type="
                  useObjectsStore().getTypeObject(
                    ('continentType:' +
                      current.culture.type.value.category!.split(':')[1]) as TypeKey,
                  )
                "
                size="small"
                color="secondary"
              />
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-2">Era</h3>
              <div
                v-if="current.culture.status.value !== 'settled'"
                style="font-style: italic; opacity: 0.5"
              >
                Hunter-Gatherer
              </div>
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-2">Heritage</h3>
              <UiObjectChips :types="current.culture.heritages.value" size="large" />
              <div
                v-if="current.culture.heritages.value.length === 0"
                style="font-style: italic; opacity: 0.5"
              >
                None selected
              </div>
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-2">Traits</h3>
              <UiObjectChips :types="current.culture.traits.value" size="large" />
              <div
                v-if="current.culture.traits.value.length === 0"
                style="font-style: italic; opacity: 0.5"
              >
                None selected
              </div>
            </div>
          </div>

          <!-- Yields -->
          <div>
            <h3>Yields</h3>
            <UiYields :yields="current.culture.yields.value" />
          </div>
        </div>
      </div>
    </template>
  </UiCols>
</template>
