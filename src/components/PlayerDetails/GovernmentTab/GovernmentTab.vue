<script setup lang="ts">
import UiCard from '@/components/Ui/UiCard.vue'
import UiYieldList from '@/components/Ui/UiYieldList.vue'
import UiObjPillList from '@/components/Ui/UiObjPillList.vue'
import { usePlayerGovernmentStore } from '@/components/PlayerDetails/GovernmentTab/governmentStore'

const government = usePlayerGovernmentStore()
</script>

<template>
  <div>
    <div class="grid grid-cols-5 gap-2 select-none">
      <div v-for="catData in Object.values(government.policiesPerCategory)" :key="catData.category.key" class="px-2">
        <h2 class="text-lg mb-1 text-center">{{ catData.category.name }}</h2>
        <UiCard v-for="policy in catData.typesData"
                :key="policy.type.key"
                class="mb-2 h-40"
                :disabled="!policy.canSelect && !policy.isSelected"
                :selected="policy.isSelected"
                :buttonText="!policy.canSelect ? 'Select' : ''"
                :title="policy.type.name"
        >
          <div class="h-full flex flex-col">
            <div class="text-xs flex flex-col flex-1">
              <div>
                <UiYieldList :yields="policy.type.yields"/>
              </div>
              <div v-if="policy.type.specials.length" class="mt-auto mb-[-0.25rem] pt-1 border-t border-green-900/25">
                <UiObjPillList :obj-keys="policy.type.specials"/>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
