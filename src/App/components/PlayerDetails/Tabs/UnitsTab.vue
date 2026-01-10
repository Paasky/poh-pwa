<script setup lang="ts">
import UiTypeChip from "@/App/components/Ui/UiTypeChip.vue";
import UiYields from "@/App/components/Ui/UiYields.vue";
import type { Unit } from "@/Common/Models/Unit";
import type { UnitDesign } from "@/Common/Models/UnitDesign";
import UiYield from "@/App/components/Ui/UiYield.vue";
import UiTable from "@/App/components/Ui/UiTable.vue";
import { includes } from "@/Common/Helpers/textTools";
import UiCols from "@/App/components/Ui/UiCols.vue";
import { useUnitsTabStore } from "@/App/components/PlayerDetails/Tabs/unitsTabStore";
import { TableColumn } from "@/Common/types/uiComponents";

const store = useUnitsTabStore();

const unitHeaders = [
  {
    title: "Name",
    key: "name",
    value: (u) => u.customName || u.design.name,
  },
  {
    title: "Design",
    key: "design",
    value: (u: Unit) => u.design.name,
  },
  { title: "Platform", key: "platform" },
  { title: "Equipment", key: "equipment" },
  { title: "Status", key: "status", value: (u: Unit) => u.status },
  { title: "Health", key: "health", align: "end", value: (u: Unit) => u.health },
  { title: "Moves", key: "moves", align: "end", value: (u: Unit) => u.movement.moves },
  { title: "City", key: "city", value: (u: Unit) => (u.city ? u.city!.name : "-") },
  {
    title: "Tile",
    key: "tile",
    value: (u: Unit) => `(${u.tile.x}, ${u.tile.y})`,
  },
  {
    title: "Action",
    key: "action",
    value: (u: Unit) => (u.action ? u.action!.name : "-"),
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
    value: (d: UnitDesign) => d.units.length,
  },
] as TableColumn<UnitDesign>[];

function searchUnit(unit: Unit, term: string): boolean {
  return includes(unit.customName, term) || searchDesign(unit.design, term);
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
          <UiYield :y="(item as UnitDesign).prodCostYield" />
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
          <v-chip :color="(item as UnitDesign).isActive ? 'green' : 'grey'" size="small">
            {{ (item as UnitDesign).isActive ? "Active" : "Inactive" }}
          </v-chip>
        </template>
      </UiTable>
    </template>
    <template #right>
      <UiTable title="Units" :columns="unitHeaders" :items="store.units" :search="searchUnit">
        <template #[`item.platform`]="{ item }">
          <UiTypeChip :type="(item as Unit).design.platform" />
        </template>
        <template #[`item.equipment`]="{ item }">
          <UiTypeChip :type="(item as Unit).design.equipment" />
        </template>
      </UiTable>
    </template>
  </UiCols>
</template>
