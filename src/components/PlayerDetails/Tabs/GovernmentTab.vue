<script setup lang="ts">
import { computed } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import { TypeObject } from "@/types/typeObjects";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";

const objStore = useObjectsStore();
const categories = objStore.getClassTypesPerCategory("policyType");

type TypeData = {
  type: TypeObject;
  isSelected: boolean;
  canSelect: boolean;
};

// Build exactly 5 rows; each cell is the type at index [row] for that category
const rows = computed(() => {
  const rows: { key: string; types: TypeData[] }[] = [];
  for (let i = 0; i < 5; i++) {
    rows.push({
      key: `row-${i}`,
      types: categories.map((cat, ii) => ({
        type: cat.types[i],
        isSelected: (i + ii) % 5 === 0,
        canSelect: (i + ii) % 3 === 0,
      })),
    });
  }
  return rows;
});
</script>

<template>
  <div class="px-4" style="width: 84rem; height: 100%">
    <v-table density="comfortable">
      <thead>
        <tr>
          <th v-for="cat in categories" :key="cat.category.key" class="border-e border-b-0">
            <h1 style="text-align: center">{{ cat.category.name }}</h1>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td
            v-for="typeData in row.types"
            :key="typeData.type.key"
            class="border-e border-b-0"
            style="height: 9rem"
          >
            <v-card
              class="h-100 d-flex flex-column ga-2 my-2"
              :variant="typeData.canSelect ? 'outlined' : 'text'"
              :color="typeData.canSelect ? 'primary' : 'disabled'"
              style="border-radius: 0.5rem"
              :style="!typeData.canSelect && !typeData.isSelected ? 'opacity: 0.75' : ''"
            >
              <!-- two children on the same row, together full width, equally wide (no extra elements, no custom css) -->
              <div class="d-flex w-100 ga-2">
                <UiObjectChip
                  :type="typeData.type"
                  color="secondary"
                  size="lg"
                  style="flex: 1 1 0; text-transform: none"
                />
                <UiButton
                  :variant="
                    typeData.isSelected ? 'elevated' : typeData.canSelect ? 'outlined' : 'text'
                  "
                  :text="
                    typeData.isSelected && typeData.canSelect
                      ? 'Selected'
                      : typeData.isSelected
                        ? 'Locked'
                        : typeData.canSelect
                          ? 'Select'
                          : 'Not Available'
                  "
                  style="flex: 1 1 0"
                  :aria-disabled="!typeData.canSelect"
                />
              </div>
              <div class="d-flex flex-column ga-1">
                <UiYields :yields="typeData.type.yields" />
              </div>
              <v-spacer />
              <!-- chips on a single row, filling available space equally (no extra elements, no custom css) -->
              <div class="d-flex w-100 ga-1">
                <UiObjectChips :types="typeData.type.specials" single-row />
              </div>
            </v-card>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped></style>
