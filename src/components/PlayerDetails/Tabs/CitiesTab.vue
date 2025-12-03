<script setup lang="ts">
import { computed, ref } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import UiTable, { TableColumn } from "@/components/Ui/UiTable.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import { City } from "@/objects/game/City";
import { usePlayerDetailsStoreNew } from "@/components/PlayerDetails/playerDetailsStore";

const objStore = useObjectsStore();
const detailsStore = usePlayerDetailsStoreNew();

const cities = computed<City[]>(() => objStore.currentPlayer.cities.value as City[]);

// Search for Cities table (only by Name for now)
const citySearch = ref("");

// Helpers to safely read names without using `any`
function getNameSafe(o: unknown): string {
  if (o && typeof o === "object" && "name" in (o as Record<string, unknown>)) {
    const v = (o as { name?: unknown }).name;
    return typeof v === "string" ? v : "";
  }
  return "";
}

function getFirstQueueItemName(queue: unknown): string {
  // Expect shape: { queue: Array<{ item: { name: string } }> }
  if (!queue || typeof queue !== "object" || !("queue" in (queue as Record<string, unknown>))) {
    return "";
  }
  const qArr = (queue as { queue?: unknown }).queue;
  if (!Array.isArray(qArr) || qArr.length === 0) return "";
  const first = qArr[0];
  if (!first || typeof first !== "object" || !("item" in (first as Record<string, unknown>))) {
    return "";
  }
  const itemVal = (first as { item?: unknown }).item;
  return getNameSafe(itemVal);
}

// Simple local filtering extended to include queue item names
const filteredCities = computed(() => {
  const q = citySearch.value.trim().toLowerCase();
  if (!q) return cities.value;
  return cities.value.filter((c) => {
    const name = (c.name.value || "").toLowerCase();
    const constructing = getFirstQueueItemName(c.constructionQueue).toLowerCase();
    const training = getFirstQueueItemName(c.trainingQueue).toLowerCase();
    return name.includes(q) || constructing.includes(q) || training.includes(q);
  });
});

// Selected city (row click)
const current = ref<City | null>(null);
function onRowClick(_e: unknown, payload: { item: unknown }) {
  current.value = payload.item as City;
}

const cityColumns = [
  { title: "Name", key: "name", value: (c: City) => c.name.value },
  {
    title: "Units",
    key: "unitsCount",
    align: "end",
    value: (c: City) => c.units.value.length,
  },
  { title: "Health", key: "health", align: "end", value: (c: City) => c.health.value },
  { title: "Yields", key: "yields" },
  { title: "Constructing", key: "constructing" },
  { title: "Training", key: "training" },
  { title: "Details", key: "details" },
] as TableColumn<City>[];
</script>

<template>
  <v-container class="pa-4" max-width="100%">
    <v-row class="ga-8">
      <v-col>
        <div class="d-flex align-center justify-space-between mb-2 w-100 ga-4">
          <h4 class="text-h6">Cities ({{ cities.length }})</h4>
          <v-text-field
            v-model="citySearch"
            density="compact"
            hide-details
            clearable
            variant="outlined"
            label="Search cities"
            prepend-inner-icon="fa-magnifying-glass"
            style="max-width: 16.25rem"
          />
        </div>
        <UiTable
          :columns="cityColumns"
          :items="filteredCities"
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
              {{ (item as City).name.value }}
              <!-- Capital star after name -->
              <v-tooltip
                v-if="(item as City).isCapital.value"
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
          <template #[`item.unitsCount`]="{ item }">
            <span
              class="d-inline-block"
              @click.stop="(item as City).units.value.length > 0 && detailsStore.open('units')"
            >
              {{ (item as City).units.value.length }}
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
              {{ (item as City).health.value }}
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
              <template v-for="r in (item as City).holyCityFor.value" :key="(r as any).key">
                <v-tooltip
                  :text="(r as any).name"
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
                    icon="fa-hand-fist"
                    color="red"
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

      <v-col>
        <h4 class="text-h6 mb-2 w-100">{{ current?.name ?? "Select City" }}</h4>
        <div class="w-100">details go here</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
