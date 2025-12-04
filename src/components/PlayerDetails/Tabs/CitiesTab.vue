<script setup lang="ts">
import { computed, ref } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import UiTable, { TableColumn } from "@/components/Ui/UiTable.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import { City } from "@/objects/game/City";
import { usePlayerDetailsStoreNew } from "@/components/PlayerDetails/playerDetailsStore";
import { includes } from "@/helpers/textTools";

const objStore = useObjectsStore();
const detailsStore = usePlayerDetailsStoreNew();

const cities = computed<City[]>(() => objStore.currentPlayer.cities.value as City[]);

// Search predicate consumed by UiTable
function searchCity(c: City, term: string): boolean {
  return (
    includes(c.name.value, term) ||
    includes(c.constructionQueue.queue[0]?.item.name ?? "", term) ||
    includes(c.trainingQueue.queue[0]?.item.name ?? "", term)
  );
}

// Selected city (row click)
const current = ref<City | null>(null);
function onRowClick(_e: unknown, payload: { item: unknown }) {
  current.value = payload.item as City;
}

const cityColumns = [
  { title: "Name", key: "name", value: (c: City) => c.name.value },
  { title: "Health", key: "health", align: "end", value: (c: City) => c.health.value },
  { title: "Yields", key: "yields" },
  { title: "Constructing", key: "constructing" },
  { title: "Training", key: "training" },
  { title: "Details", key: "details" },
] as TableColumn<City>[];
</script>

<template>
  <v-container class="pa-4" max-width="100%">
    <v-row class="ga-4">
      <v-col v-if="current" class="border-b pb-4">
        <!-- Header: pin + editable name styled as <h4> + pencil inline -->
        <div class="d-flex ga-2 mb-4">
          <div class="d-flex align-center ga-4 d-flex-grow-0">
            <v-tooltip
              text="Show on Map"
              location="bottom"
              content-class="text-grey bg-grey-darken-4"
            >
              <template #activator="{ props }">
                <v-icon v-bind="props" icon="fa-location-dot" color="white" size="small" />
              </template>
            </v-tooltip>

            <!-- Title as h4, input inside, pencil icon follows text -->
            <h1>
              {{ current.name }}
            </h1>

            <v-tooltip
              text="Change name"
              location="bottom"
              content-class="text-grey bg-grey-darken-4"
            >
              <template #activator="{ props }">
                <v-icon v-bind="props" icon="fa-pen" color="white" size="x-small" class="ml-1" />
              </template>
            </v-tooltip>

            <div class="mt-1 opacity-50" style="white-space: nowrap">Pop. {{ current.pop }}</div>
          </div>

          <div class="d-flex ga-2 align-center justify-end d-flex-grow-1" style="width: 100%">
            <UiYields :yields="current.yields" />
          </div>
        </div>

        <!-- Row 1: Construction & Training queue dropdowns -->
        <v-row class="ga-2">
          <v-col aria-colspan="2"><h2>Construction</h2></v-col>
          <v-col aria-colspan="1"><h4>Next in Queue</h4></v-col>
          <v-col aria-colspan="2"><h2>Training</h2></v-col>
          <v-col aria-colspan="1"><h4>Next in Queue</h4></v-col>
        </v-row>
        <v-row class="ga-2">
          <v-col aria-colspan="2">
            <v-select
              placeholder="Converting to Gold and Happiness"
              :items="current.constructableTypes"
              item-title="name"
              return-object
              :model-value="(current.constructionQueue.queue[0]?.item as any) ?? null"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col aria-colspan="1">
            <div v-for="qItem of current.constructionQueue.queue.slice(1)" :key="qItem.item.key">
              {{ qItem.item.name }}
            </div>
          </v-col>
          <v-col aria-colspan="2">
            <v-select
              placeholder="Converting to Food and Order"
              :items="current.trainableDesigns"
              item-title="name"
              return-object
              :model-value="(current.trainingQueue.queue[0]?.item as any) ?? null"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col aria-colspan="1">
            <div v-for="qItem of current.trainingQueue.queue.slice(1)" :key="qItem.item.key">
              {{ qItem.item.name }}
            </div>
          </v-col>
        </v-row>

        <!-- Row 2: Citizens table -->
        <div>
          <div class="text-subtitle-2 mb-2">Citizens</div>
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-left">Culture</th>
                <th class="text-left">Religion</th>
                <th class="text-left">Policy</th>
                <th class="text-left">Work</th>
                <th class="text-left">Yields</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="citizen in current.citizens" :key="citizen.key">
                <td>{{ citizen.culture.value.type.value.name }}</td>
                <td>{{ citizen.religion.value?.name ?? "-" }}</td>
                <td>{{ citizen.policy.value?.name ?? "-" }}</td>
                <td>
                  {{ citizen.work.value?.name ?? (citizen as any).tile.construction?.name ?? "-" }}
                </td>
                <td>
                  <UiYields :yields="citizen.yields.value" :opts="{ posLumpIsNeutral: true }" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-col>
      <v-col>
        <UiTable
          title="Cities"
          :columns="cityColumns"
          :items="cities"
          :search="searchCity"
          @click:row="onRowClick"
          :hover="true"
          class="w-100"
        >
          <template #[`item.name`]="{ item }">
            <span class="d-inline-flex align-center ga-2">
              <!-- Location pin before name -->
              <v-tooltip
                text="Show on Map"
                location="bottom"
                content-class="text-grey bg-grey-darken-4"
              >
                <template #activator="{ props }">
                  <v-icon v-bind="props" icon="fa-location-dot" color="white" size="small" />
                </template>
              </v-tooltip>
              <!-- Name -->
              {{ (item as City).name }}
              <!-- Capital star after name -->
              <v-tooltip
                v-if="(item as City).isCapital"
                text="Capital City"
                location="bottom"
                content-class="text-grey bg-grey-darken-4"
              >
                <template #activator="{ props }">
                  <v-icon v-bind="props" icon="fa-star" color="gold" size="small" />
                </template>
              </v-tooltip>
            </span>
          </template>
          <template #[`item.health`]="{ item }">
            <span
              :class="[
                (item as City).health.value < 75
                  ? 'text-red'
                  : (item as City).health.value < 100
                    ? 'text-orange font-weight-bold'
                    : '',
              ]"
              class="d-inline-block text-right"
            >
              {{ (item as City).health }}
            </span>
          </template>
          <template #[`item.yields`]="{ item }">
            <UiYields :yields="(item as City).yields.value" :opts="{ posLumpIsNeutral: true }" />
          </template>
          <template #[`item.constructing`]="{ item }">
            <span>
              {{ ((item as City).constructionQueue.queue[0]?.item as any)?.name ?? "-" }}
              <template v-if="(item as City).constructionQueue.queue.length > 0">
                —
                {{ (item as City).constructionQueue.queue[0].progress }}/{{
                  (item as City).constructionQueue.queue[0].cost
                }}
                <span v-if="(item as City).constructionQueue.queue.length > 1">
                  ({{ (item as City).constructionQueue.queue.length - 1 }} queued)
                </span>
              </template>
            </span>
          </template>
          <template #[`item.training`]="{ item }">
            <span>
              {{ ((item as City).trainingQueue.queue[0]?.item as any)?.name ?? "-" }}
              <template v-if="(item as City).trainingQueue.queue.length > 0">
                —
                {{ (item as City).trainingQueue.queue[0].progress }}/{{
                  (item as City).trainingQueue.queue[0].cost
                }}
                <span v-if="(item as City).trainingQueue.queue.length > 1">
                  ({{ (item as City).trainingQueue.queue.length - 1 }} queued)
                </span>
              </template>
            </span>
          </template>
          <template #[`item.details`]="{ item }">
            <div class="d-flex align-center ga-4">
              <!-- Citizens count -->
              <v-tooltip
                :text="`${(item as City).citizens.value.length} Citizens (pop. ${(item as City).pop.value})`"
                location="bottom"
                content-class="text-grey bg-grey-darken-4"
              >
                <template #activator="{ props }">
                  <span class="d-inline-flex align-center ga-1" v-bind="props">
                    <v-icon icon="fa-users" color="white" size="small" />
                    {{ (item as City).citizens.value.length }}
                  </span>
                </template>
              </v-tooltip>

              <!-- Holy city for religions -->
              <template v-for="religion in (item as City).holyCityFor.value" :key="religion.key">
                <v-tooltip
                  :text="religion.name"
                  location="bottom"
                  content-class="text-grey bg-grey-darken-4"
                >
                  <template #activator="{ props }">
                    <v-icon
                      v-bind="props"
                      icon="fa-star"
                      color="lightPurple"
                      size="small"
                      @click.stop="detailsStore.open('religion')"
                    />
                  </template>
                </v-tooltip>
              </template>

              <!-- Original founder different than current owner -->
              <v-tooltip
                v-if="(item as City).origPlayerKey !== (item as City).playerKey.value"
                :text="`Founded by ${(item as City).origPlayer.value.name}`"
                location="bottom"
                content-class="text-grey bg-grey-darken-4"
              >
                <template #activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="fa-theater-masks"
                    color="disabled"
                    size="small"
                    @click.stop="detailsStore.open('diplomacy')"
                  />
                </template>
              </v-tooltip>

              <!-- Can attack -->
              <v-tooltip
                v-if="(item as City).canAttack.value"
                text="Can attack"
                location="bottom"
                content-class="text-grey bg-grey-darken-4"
              >
                <template #activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="fa-bullseye"
                    color="red"
                    size="small"
                    class="pulse"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
        </UiTable>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
