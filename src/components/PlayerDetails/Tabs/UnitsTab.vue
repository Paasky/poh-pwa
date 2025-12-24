<script setup lang="ts">
import UiTypeChip from "@/components/Ui/UiTypeChip.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import type { Unit } from "@/objects/game/Unit";
import type { UnitDesign } from "@/objects/game/UnitDesign";
import UiYield from "@/components/Ui/UiYield.vue";
import UiTable, { TableColumn } from "@/components/Ui/UiTable.vue";
import { includes } from "@/helpers/textTools";
import UiCols from "@/components/Ui/UiCols.vue";
import { useUnitsTabStore } from "@/components/PlayerDetails/Tabs/unitsTabStore";

const store = useUnitsTabStore();

const unitHeaders = [
  {
    title: "Name",
    key: "name",
    value: (u) => u.customName.value || u.design.value.name,
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
  { title: "Moves", key: "moves", align: "end", value: (u: Unit) => u.movement.moves.value },
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

function searchUnit(unit: Unit, term: string): boolean {
  return includes(unit.customName.value, term) || searchDesign(unit.design.value, term);
}

function searchDesign(design: UnitDesign, term: string): boolean {
  return (
    includes(design.name, term) ||
    includes(design.platform.name, term) ||
    includes(design.equipment.name, term)
  );
}

// Filtering handled by UiTable via the provided search predicate
</script>

<template>
  <UiCols>
    <template #left>
      <UiTable
        title="Unit Designs"
        :columns="designHeaders"
        :items="store.designs"
        :search="searchDesign"
      >
        <template #[`item.platform`]="{ item }">
          <UiTypeChip :type="(item as UnitDesign).platform" />
        </template>
        <template #[`item.equipment`]="{ item }">
          <UiTypeChip :type="(item as UnitDesign).equipment" />
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
    </template>
    <template #right>
      <UiTable title="Units" :columns="unitHeaders" :items="store.units" :search="searchUnit">
        <template #[`item.platform`]="{ item }">
          <UiTypeChip :type="(item as Unit).design.value.platform" />
        </template>
        <template #[`item.equipment`]="{ item }">
          <UiTypeChip :type="(item as Unit).design.value.equipment" />
        </template>
      </UiTable>
    </template>
  </UiCols>
</template>
