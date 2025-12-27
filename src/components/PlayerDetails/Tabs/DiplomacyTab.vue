<script setup lang="ts">
import UiTable from "@/components/Ui/UiTable.vue";
import type { Player } from "@/objects/game/Player";
import { includes } from "@/helpers/textTools";
import UiTypeChip from "@/components/Ui/UiTypeChip.vue";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import UiCols from "@/components/Ui/UiCols.vue";
import { useDiplomacyTabStore } from "@/components/PlayerDetails/Tabs/diplomacyTabStore";

const store = useDiplomacyTabStore();

function onRowClick(_e: unknown, payload: { item: { raw: Player } }) {
  // IDE doesn't understand that both are Player
  store.current = payload.item.raw as never;
}

// Search predicate similar to CitiesTab.searchCity
function searchPlayer(p: Player, term: string): boolean {
  return (
    includes(p.name, term) ||
    includes(p.culture.type.name, term) ||
    includes(p.leader.name, term) ||
    includes(p.religion.value?.name ?? "", term)
  );
}
</script>

<template>
  <UiCols>
    <template #left>
      <UiTable
        title="Players"
        :items="store.players"
        :columns="store.columns"
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
      <div v-if="store.current" class="d-flex flex-column ga-6">
        <!-- Leader -->
        <div class="d-flex flex-column ga-4">
          <h2>Leader</h2>
          <div class="d-flex align-center ga-2" style="font-size: 1rem">
            <template v-for="(type, i) in store.leaderTimeline" :key="type.key">
              <v-icon v-if="i > 0" icon="fa-chevron-right" color="grey" size="x-small" />
              <UiTypeChip
                :type="type"
                :size="store.current.leader.key === type.key ? 'large' : 'x-small'"
                color="secondary"
              />
            </template>
          </div>
          <v-img
            v-if="store.current.leader.image"
            :src="store.current.leader.image"
            :alt="store.current.leader.name + ' image'"
            width="512"
            class="rounded"
            cover
          />
        </div>

        <!-- Culture -->
        <div class="d-flex flex-column ga-4">
          <h2>Culture</h2>
          <div class="d-flex align-center ga-2" style="font-size: 1rem">
            <template v-for="(type, i) in store.cultureTimeline" :key="type.key">
              <v-icon v-if="i > 0" icon="fa-chevron-right" color="grey" size="x-small" />
              <UiTypeChip
                :type="type"
                :size="store.current.culture.type.key === type.key ? 'large' : 'x-small'"
                color="secondary"
              />
            </template>
          </div>

          <!-- Sub Headers -->
          <div class="d-flex ga-2">
            <div class="flex-grow-1">
              <h3 class="mb-2">Region</h3>
              <UiTypeChip :type="store.current.culture.region" size="small" color="secondary" />
              <UiTypeChip
                :type="
                  // continent derived from culture category
                  store.current.culture.type.value
                "
                size="small"
                color="secondary"
              />
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-2">Era</h3>
              <div
                v-if="store.current.culture.status !== 'settled'"
                style="font-style: italic; opacity: 0.5"
              >
                Hunter-Gatherer
              </div>
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-2">Heritage</h3>
              <UiObjectChips :types="store.current.culture.heritages" size="large" />
              <div
                v-if="store.current.culture.heritages.length === 0"
                style="font-style: italic; opacity: 0.5"
              >
                None selected
              </div>
            </div>
            <div class="flex-grow-1">
              <h3 class="mb-2">Traits</h3>
              <UiObjectChips :types="store.current.culture.traits" size="large" />
              <div
                v-if="store.current.culture.traits.length === 0"
                style="font-style: italic; opacity: 0.5"
              >
                None selected
              </div>
            </div>
          </div>

          <!-- Yields -->
          <div>
            <h3>Yields</h3>
            <UiYields :yields="store.current.culture.yields" />
          </div>
        </div>
      </div>
    </template>
  </UiCols>
</template>
