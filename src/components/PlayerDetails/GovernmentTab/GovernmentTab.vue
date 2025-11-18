<script setup lang="ts">
import UiCard from '@/components/Ui/UiCard.vue'
import UiYieldList from '@/components/Ui/UiYieldList.vue'
import UiObjPillList from '@/components/Ui/UiObjPillList.vue'
import { useObjectsStore } from '@/stores/objectStore'

const objects = useObjectsStore()
const government = objects.getCurrentPlayer().government
</script>

<template>
  <div>
    <div class="grid grid-cols-5 gap-2 select-none">
      <div v-for="catData in objects.getClassTypesPerCategory('policyType')" :key="catData.category.key" class="px-2">
        <h2 class="text-lg mb-1 text-center">{{ catData.category.name }}</h2>
        <UiCard v-for="policy in catData.types"
                :key="policy.key"
                class="mb-2 h-40"
                :disabled="!government.selectablePolicies.includes(policy) && !government.policies.includes(policy)"
                :selected="government.policies.includes(policy)"
                :buttonText="!government.selectablePolicies.includes(policy) ? 'Select' : ''"
                :title="policy.name"
        >
          <div class="h-full flex flex-col">
            <div class="text-xs flex flex-col flex-1">
              <div>
                <UiYieldList :yields="policy.yields"/>
              </div>
              <div v-if="policy.requires.length" class="pt-1 border-t border-green-900/25">
                <UiObjPillList :obj-keys="policy.requires"/>
              </div>
              <div v-if="policy.specials.length" class="mt-auto mb-[-0.25rem] pt-1 border-t border-green-900/25">
                <UiObjPillList :obj-keys="policy.specials"/>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
