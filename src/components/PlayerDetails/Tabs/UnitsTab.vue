<script setup lang="ts">
import { computed, ref } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import type { Unit } from "@/objects/game/Unit";
import type { UnitDesign } from "@/objects/game/UnitDesign";
import UiYield from "@/components/Ui/UiYield.vue";
import UiTable, { TableColumn } from "@/components/Ui/UiTable.vue";
import { includes } from "@/helpers/textTools";

const objStore = useObjectsStore();
const player = computed(() => objStore.currentPlayer);

const units = computed<Unit[]>(() => player.value.units.value as Unit[]);
const designs = computed<UnitDesign[]>(() => player.value.designs.value as UnitDesign[]);

const unitHeaders = [
  {
    title: "Name",
    key: "name",
    value: (u) => u.name.value || u.design.value.name,
  },
  {
    title: "Design",
    key: "design",
    value: (u: Unit) => u.design.value.name,
  },
  { title: "Platform", key: "platform" },
  { title: "Equipment", key: "equipment" },
  { title: "Status", key: "status", value: (u: Unit) => u.status.value },
  { title: "Health", key: "health", align: "end", value: (u: Unit) => u.health.value },
  { title: "Moves", key: "moves", align: "end", value: (u: Unit) => u.moves.value },
  { title: "City", key: "city", value: (u: Unit) => (u.city.value ? u.city.value!.name : "-") },
  {
    title: "Tile",
    key: "tile",
    value: (u: Unit) => `(${u.tile.value.x}, ${u.tile.value.y})`,
  },
  {
    title: "Action",
    key: "action",
    value: (u: Unit) => (u.action.value ? u.action.value!.name : "-"),
  },
] as TableColumn<Unit>[];

const designHeaders = [
  { title: "Name", key: "name", value: (d: UnitDesign) => d.name },
  { title: "Platform", key: "platform" },
  { title: "Equipment", key: "equipment" },
  {
    title: "Cost",
    key: "prodCostYield",
    align: "end",
  },
  { title: "Yields", key: "yields" },
  { title: "Elite", key: "isElite" },
  { title: "Active", key: "isActive" },
  {
    title: "Units",
    key: "unitsCount",
    align: "end",
    value: (d: UnitDesign) => d.units.value.length,
  },
] as TableColumn<UnitDesign>[];

// Search
const unitSearch = ref("");
const designSearch = ref("");

function searchUnit(unit: Unit, term: string): boolean {
  return includes(unit.name.value, term) || searchDesign(unit.design.value, term);
}
function searchDesign(design: UnitDesign, term: string): boolean {
  return (
    includes(design.name, term) ||
    includes(design.platform.name, term) ||
    includes(design.equipment.name, term)
  );
}

const filteredUnits = computed(() =>
  unitSearch.value.trim()
    ? units.value.filter((u) => searchUnit(u, unitSearch.value))
    : units.value,
);

const filteredDesigns = computed(() =>
  designSearch.value.trim()
    ? designs.value.filter((d) => searchDesign(d, unitSearch.value))
    : designs.value,
);
</script>

<template>
  <v-container class="pa-4" max-width="100%">
    <v-row class="ga-8">
      <v-col>
        <div class="d-flex align-center justify-space-between mb-2 w-100 ga-4">
          <h4 class="text-h6">Units ({{ units.length }})</h4>
          <v-text-field
            v-model="unitSearch"
            density="compact"
            hide-details
            clearable
            variant="outlined"
            label="Search units"
            prepend-inner-icon="fa-magnifying-glass"
            style="max-width: 16.25rem"
          />
        </div>
        <UiTable :columns="unitHeaders" :items="filteredUnits" class="w-100">
          <template #[`item.platform`]="{ item }">
            <UiObjectChip :type="(item as Unit).design.value.platform" />
          </template>
          <template #[`item.equipment`]="{ item }">
            <UiObjectChip :type="(item as Unit).design.value.equipment" />
          </template>
        </UiTable>
      </v-col>

      <v-col>
        <div class="d-flex align-center justify-space-between mb-2 w-100 ga-4">
          <h4 class="text-h6">Unit Designs ({{ designs.length }})</h4>
          <v-text-field
            v-model="designSearch"
            density="compact"
            hide-details
            clearable
            variant="outlined"
            label="Search designs"
            prepend-inner-icon="fa-magnifying-glass"
            style="max-width: 16.25rem"
          />
        </div>
        <UiTable :columns="designHeaders" :items="filteredDesigns" class="w-100">
          <template #[`item.platform`]="{ item }">
            <UiObjectChip :type="(item as UnitDesign).platform" />
          </template>
          <template #[`item.equipment`]="{ item }">
            <UiObjectChip :type="(item as UnitDesign).equipment" />
          </template>
          <template #[`item.prodCostYield`]="{ item }">
            <UiYield :y="(item as UnitDesign).prodCostYield.value" />
          </template>
          <template #[`item.yields`]="{ item }">
            <UiYields :yields="(item as UnitDesign).yields" :opts="{ posLumpIsNeutral: true }" />
          </template>
          <template #[`item.isElite`]="{ item }">
            <v-chip :color="(item as UnitDesign).isElite ? 'primary' : 'grey'" size="small">
              {{ (item as UnitDesign).isElite ? "Elite" : "Regular" }}
            </v-chip>
          </template>
          <template #[`item.isActive`]="{ item }">
            <v-chip :color="(item as UnitDesign).isActive.value ? 'green' : 'grey'" size="small">
              {{ (item as UnitDesign).isActive.value ? "Active" : "Inactive" }}
            </v-chip>
          </template>
        </UiTable>
      </v-col>
    </v-row>
  </v-container>
</template>
