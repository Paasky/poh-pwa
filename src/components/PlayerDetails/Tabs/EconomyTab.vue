<script setup lang="ts">
import { computed, ref } from "vue";
import type { City } from "@/objects/game/City";
import type { Citizen } from "@/objects/game/Citizen";
import { useEconomyTabStore } from "@/components/PlayerDetails/Tabs/economyTabStore";

const store = useEconomyTabStore();

// Adapt items for the table to avoid custom slots that eslint flags
const rows = computed(() =>
  store.cities.map((c) => ({ key: c.key as unknown as string, source: c.name.value, _city: c })),
);

// Track expanded rows
const expanded = ref<string[]>([]);

function toggleExpand(cityKey: string) {
  const i = expanded.value.indexOf(cityKey);
  if (i >= 0) expanded.value.splice(i, 1);
  else expanded.value.push(cityKey);
}

function citizensOf(city: City): Citizen[] {
  return city.citizens.value as Citizen[];
}

function onRowClick(_e: unknown, payload: { item: { value: unknown } }) {
  toggleExpand(payload.item.value as string);
}
</script>

<template>
  <div class="pa-4 d-flex flex-column" style="width: 100%; height: 100%">
    <v-data-table
      :headers="store.headers"
      :items="rows"
      :item-value="'key'"
      hide-default-footer
      density="compact"
      class="w-100 flex-1-1"
      show-expand
      v-model:expanded="expanded"
      @click:row="onRowClick"
    >
      <!-- Expanded content: one row per citizen under the city -->
      <template #expanded-row="{ item }">
        <tr>
          <td :colspan="store.headers.length" class="pa-0">
            <v-data-table
              :headers="store.headers"
              :items="
                citizensOf((item as any).raw._city as City).map((cz) => ({
                  key: cz.key as unknown as string,
                  source: `Citizen (${cz.key})`,
                  _citizen: cz,
                }))
              "
              item-key="key"
              hide-default-footer
              density="compact"
              class="w-100"
            />
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>
