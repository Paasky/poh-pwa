<script setup lang="ts">
import { computed, ref } from "vue";
import UiTable from "@/App/components/Ui/UiTable.vue";
import UiYields from "@/App/components/Ui/UiYields.vue";
import { City } from "@/Common/Models/City";
import { usePlayerDetailsStore } from "@/App/components/PlayerDetails/playerDetailsStore";
import { includes } from "@/Common/Helpers/textTools";
import UiCols from "@/App/components/Ui/UiCols.vue";
import { useCitiesTabStore } from "@/App/components/PlayerDetails/Tabs/citiesTabStore";
import { TableColumn } from "@/Common/types/uiComponents";

const detailsStore = usePlayerDetailsStore();
const store = useCitiesTabStore();

const cities = computed<City[]>(() => store.cities);

// Search predicate consumed by UiTable
function searchCity(c: City, term: string): boolean {
  return (
    includes(c.name, term) ||
    includes(c.constructionQueue.items[0]?.item.name ?? "", term) ||
    includes(c.trainingQueue.items[0]?.item.name ?? "", term)
  );
}

// Selected city (row click)
const current = ref<City | null>(null);

function onRowClick(_e: unknown, payload: { item: unknown }) {
  current.value = payload.item as City;
}

const cityColumns = store.columns as unknown as TableColumn<City>[];
</script>

<template>
  <UiCols>
    <template #left>
      <UiTable
        title="Cities"
        :columns="cityColumns"
        :items="cities"
        :search="searchCity"
        @click:row="onRowClick"
        :hover="true"
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
                <UiIcon v-bind="props" icon="locate" color="white" size="sm" />
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
                <UiIcon v-bind="props" icon="star" color="gold" size="sm" />
              </template>
            </v-tooltip>
          </span>
        </template>
        <template #[`item.health`]="{ item }">
          <span
            :class="[
              (item as City).health < 75
                ? 'text-red'
                : (item as City).health < 100
                  ? 'text-orange font-weight-bold'
                  : '',
            ]"
            class="d-inline-block text-right"
          >
            {{ (item as City).health }}
          </span>
        </template>
        <template #[`item.yields`]="{ item }">
          <UiYields :yields="(item as City).yields" :opts="{ posLumpIsNeutral: true }" />
        </template>
        <template #[`item.constructing`]="{ item }">
          <span>
            {{ ((item as City).constructionQueue.items[0]?.item as any)?.name ?? "-" }}
            <template v-if="(item as City).constructionQueue.items.length > 0">
              —
              {{ (item as City).constructionQueue.items[0].progress }}/{{
                (item as City).constructionQueue.items[0].cost
              }}
              <span v-if="(item as City).constructionQueue.items.length > 1">
                ({{ (item as City).constructionQueue.items.length - 1 }} queued)
              </span>
            </template>
          </span>
        </template>
        <template #[`item.training`]="{ item }">
          <span>
            {{ ((item as City).trainingQueue.items[0]?.item as any)?.name ?? "-" }}
            <template v-if="(item as City).trainingQueue.items.length > 0">
              —
              {{ (item as City).trainingQueue.items[0].progress }}/{{
                (item as City).trainingQueue.items[0].cost
              }}
              <span v-if="(item as City).trainingQueue.items.length > 1">
                ({{ (item as City).trainingQueue.items.length - 1 }} queued)
              </span>
            </template>
          </span>
        </template>
        <template #[`item.details`]="{ item }">
          <div class="d-flex align-center ga-4">
            <!-- Citizens count -->
            <v-tooltip
              :text="`${(item as City).citizens.length} Citizens (pop. ${(item as City).pop.value})`"
              location="bottom"
              content-class="text-grey bg-grey-darken-4"
            >
              <template #activator="{ props }">
                <span class="d-inline-flex align-center ga-1" v-bind="props">
                  <UiIcon icon="users" color="white" size="sm" />
                  {{ (item as City).citizens.length }}
                </span>
              </template>
            </v-tooltip>

            <!-- Holy city for religions -->
            <template v-for="religion in (item as City).holyCityFors" :key="religion.key">
              <v-tooltip
                :text="religion.name"
                location="bottom"
                content-class="text-grey bg-grey-darken-4"
              >
                <template #activator="{ props }">
                  <UiIcon
                    v-bind="props"
                    icon="star"
                    color="lightPurple"
                    size="sm"
                    @click.stop="detailsStore.open('religion')"
                  />
                </template>
              </v-tooltip>
            </template>

            <!-- Original founder different than current owner -->
            <v-tooltip
              v-if="(item as City).origPlayerKey !== (item as City).playerKey"
              :text="`Founded by ${(item as City).origPlayer.name}`"
              location="bottom"
              content-class="text-grey bg-grey-darken-4"
            >
              <template #activator="{ props }">
                <UiIcon
                  v-bind="props"
                  icon="masksTheater"
                  color="disabled"
                  size="sm"
                  @click.stop="detailsStore.open('diplomacy')"
                />
              </template>
            </v-tooltip>

            <!-- Can attack -->
            <v-tooltip
              v-if="(item as City).canAttack"
              text="Can attack"
              location="bottom"
              content-class="text-grey bg-grey-darken-4"
            >
              <template #activator="{ props }">
                <UiIcon v-bind="props" icon="bullseye" color="red" size="sm" class="pulse" />
              </template>
            </v-tooltip>
          </div>
        </template>
      </UiTable>
    </template>
    <template #right>
      <div v-if="current" class="d-flex flex-column">
        <div class="d-flex justify-space-between align-center ga-2 mb-4" style="width: 100%">
          <div class="flex-shrink-0 d-flex align-center ga-4">
            <v-tooltip
              text="Show on Map"
              location="bottom"
              content-class="text-grey bg-grey-darken-4"
            >
              <template #activator="{ props }">
                <UiIcon v-bind="props" icon="locate" color="white" size="sm" />
              </template>
            </v-tooltip>

            <h1>
              {{ current.name }}
            </h1>

            <v-tooltip
              text="Change name"
              location="bottom"
              content-class="text-grey bg-grey-darken-4"
            >
              <template #activator="{ props }">
                <UiIcon v-bind="props" icon="edit" color="white" size="xs" class="ml-1" />
              </template>
            </v-tooltip>

            <div class="opacity-50">Pop. {{ current.pop }}</div>
          </div>

          <v-card
            class="flex-shrink-0 d-flex ga-2 align-center px-2 py-1"
            variant="elevated"
            color="secondary"
          >
            <UiYields :yields="current.yields" :opts="{ posLumpIsNeutral: true }" />
          </v-card>
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
            <UiSelect
              placeholder="Converting to Gold and Happiness"
              :items="current.constructableTypes"
              item-title="name"
              return-object
              :model-value="(current.constructionQueue.queue[0]?.item as any) ?? null"
              label="Construction"
            />
          </v-col>
          <v-col aria-colspan="1">
            <div v-for="qItem of current.constructionQueue.queue.slice(1)" :key="qItem.item.key">
              {{ qItem.item.name }}
            </div>
          </v-col>
          <v-col aria-colspan="2">
            <UiSelect
              placeholder="Converting to Food and Order"
              :items="current.trainableDesigns"
              item-title="name"
              return-object
              :model-value="(current.trainingQueue.queue[0]?.item as any) ?? null"
              label="Training"
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
                <th class="text-left border-e border-b-0">Culture</th>
                <th class="text-left border-e border-b-0">Religion</th>
                <th class="text-left border-e border-b-0">Policy</th>
                <th class="text-left border-e border-b-0">Work</th>
                <th class="text-left border-e border-b-0">Yields</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="citizen in current.citizens" :key="citizen.key">
                <td class="border-e border-b-0">{{ citizen.culture.type.name }}</td>
                <td class="border-e border-b-0">{{ citizen.religion.value?.name ?? "-" }}</td>
                <td class="border-e border-b-0">{{ citizen.policy.value?.name ?? "-" }}</td>
                <td class="border-e border-b-0">
                  {{ citizen.work.value?.name ?? (citizen as any).tile.construction?.name ?? "-" }}
                </td>
                <td class="border-e border-b-0">
                  <UiYields :yields="citizen.yields" :opts="{ posLumpIsNeutral: true }" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </div>
    </template>
  </UiCols>
</template>

<style scoped></style>
