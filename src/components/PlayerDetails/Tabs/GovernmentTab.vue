<script setup lang="ts">
import { computed } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import { TypeObject } from "@/types/typeObjects";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";

const objStore = useObjectsStore();

// Take first 5 categories of policyType
const categories = objStore.getClassTypesPerCategory("policyType");

// Build exactly 5 rows; each cell is the type at index [row] for that category
const rows = computed(() => {
  const rows: { key: string; types: TypeObject[] }[] = [];
  for (let i = 0; i < 5; i++) {
    rows.push({
      key: `row-${i}`,
      types: categories.map((cat) => cat.types[i]),
    });
  }
  return rows;
});
</script>

<template>
  <div class="px-4" style="width: 100%; height: 100%">
    <v-table density="comfortable">
      <thead>
        <tr>
          <th v-for="cat in categories" :key="cat.category.key">
            <h1>{{ cat.category.name }}</h1>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td v-for="type in row.types" :key="type.key" style="height: 9rem">
            <v-card
              class="h-100 d-flex flex-column ga-2 my-2"
              variant="outlined"
              color="disabled"
              style="border-radius: 0.5rem"
            >
              <!-- two children on the same row, together full width, equally wide (no extra elements, no custom css) -->
              <div class="d-flex w-100 ga-2">
                <UiObjectChip :type="type" color="secondary" size="lg" style="flex: 1 1 0" />
                <UiButton variant="tonal" text="Select" style="flex: 1 1 0" />
              </div>
              <div class="d-flex flex-column ga-1">
                <UiYields :yields="type.yields" />
              </div>
              <v-spacer />
              <!-- todo: make children (chips is a v-for) go on a single row and fill the space -->
              <div class="d-flex w-100 ga-1">
                <UiObjectChips :types="type.specials" />
              </div>
            </v-card>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped></style>
