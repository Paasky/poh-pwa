<script setup lang="ts">
import { computed } from 'vue'
import { useObjectsStore } from '@/stores/objectStore'
import { TypeObject } from '@/types/typeObjects'
import UiObjectCard from '@/components/Ui/UiObjectCard.vue'

const objStore = useObjectsStore()
const categories = objStore.getClassTypesPerCategory('policyType')

type TypeData = {
  type: TypeObject;
  isSelected: boolean;
  canSelect: boolean;
};

// Build exactly 5 rows; each cell is the type at index [row] for that category
const rows = computed(() => {
  const rows: { key: string; types: TypeData[] }[] = []
  for (let i = 0; i < 5; i++) {
    rows.push({
      key: `row-${i}`,
      types: categories.map((cat, ii) => ({
        type: cat.types[i],
        isSelected: (i + ii) % 5 === 0,
        canSelect: (i + ii) % 3 === 0,
      })),
    })
  }
  return rows
})
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
          <UiObjectCard :type="typeData.type" :isSelected="typeData.isSelected" :canSelect="typeData.canSelect"/>
        </td>
      </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped></style>
