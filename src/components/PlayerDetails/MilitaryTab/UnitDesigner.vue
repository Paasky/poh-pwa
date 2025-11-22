<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { GameObject, UnitDesign } from '@/types/gameObjects'
import { useObjectsStore } from '@/stores/objectStore'
import { TypeObject } from '@/types/typeObjects'
import UiButton from '@/components/Ui/UiButton.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { UnitDesignManager } from '@/managers/unitDesignManager'
import UiUnitIcon from '@/components/Ui/UiUnitIcon.vue'
import UiYieldList from '@/components/Ui/UiYieldList.vue'
import UiObjPillList from '@/components/Ui/UiObjPillList.vue'

const manager = new UnitDesignManager()
const objects = useObjectsStore()

// Make player reactive so UI updates when store changes
const player = computed(() => objects.getCurrentPlayer())

const designs = computed(() => player.value.unitDesigns.map(design => objects.getGameObject(design) as UnitDesign))
const knownEquipment = computed(() => player.value.knownTypes.filter(t => t.class === 'equipmentType'))
const knownPlatforms = computed(() => player.value.knownTypes.filter(t => t.class === 'platformType'))

const possibleDesigns = computed(() => {
  const possible = [] as { platform: TypeObject, equipment: TypeObject, upgradesFrom: UnitDesign[] }[]

  for (const platform of knownPlatforms.value) {
    for (const equipment of knownEquipment.value) {
      // Platform must be available for the equipment
      if (!equipment.names![platform.key]) continue

      // Design cannot exist
      if (designs.value.filter(d => d.platform === platform && d.equipment === equipment).length > 0) continue

      possible.push({
        platform,
        equipment,
        upgradesFrom: designs.value.filter(d =>
            (d.platform === platform || d.platform.upgradesTo.includes(platform.key)) &&
            (d.equipment === equipment || d.equipment.upgradesTo.includes(equipment.key))
        )
      })
    }
  }

  return possible
})

// Form values
const newDesign = ref({
  platform: null as TypeObject | null,
  equipment: null as TypeObject | null,
  name: '' as string,
  elite: false as boolean,
  upgradesFrom: [] as GameObject[]
})

const equipmentOptions = computed(() => {
  if (!newDesign.value.platform) return [] as TypeObject[]
  const opts: TypeObject[] = []
  for (const possibleDesign of possibleDesigns.value) {
    if (newDesign.value.platform === possibleDesign.platform) opts.push(possibleDesign.equipment)
  }
  return opts
})

const upgradeOptions = computed(() => {
  if (!newDesign.value.platform || !newDesign.value.equipment) return [] as UnitDesign[]
  const opts: UnitDesign[] = []
  for (const possibleDesign of possibleDesigns.value) {
    if (possibleDesign.platform === newDesign.value.platform && possibleDesign.equipment === newDesign.value.equipment) {
      opts.push(...possibleDesign.upgradesFrom)
    }
  }
  return opts
})

watch(newDesign, () => {
  // Must have a platform to select equipment/have a name
  if (!newDesign.value.platform) {
    newDesign.value.equipment = null
    return
  }

  // Drop invalid equipment if it is no longer available
  if (newDesign.value.equipment && !equipmentOptions.value.includes(newDesign.value.equipment)) {
    newDesign.value.equipment = null
  }

  // Auto-select when exactly one option
  if (!newDesign.value.equipment && equipmentOptions.value.length === 1) {
    newDesign.value.equipment = equipmentOptions.value[0]
  }

  newDesign.value.name = newDesign.value.platform && newDesign.value.equipment
      ? newDesign.value.equipment.names[newDesign.value.platform.key]
      : ''
}, { deep: true })
</script>

<template>
  <div>
    <!-- Info to user -->
    <div>
      You have {{ player.yieldStorage.amount('yieldType:designPoints') }} Design Point(s)
      <UiButton @click="player.yieldStorage.add('yieldType:designPoints', 1)" class="mb-4">+1 DP</UiButton>
    </div>
    <div v-if="player.yieldStorage.amount('yieldType:designPoints') < 2" class="text-slate-400">
      You need at least 2 Design Points to design a unit
    </div>
    <div v-else-if="possibleDesigns.length === 0" class="text-slate-400">No possible new designs</div>

    <!-- Designer shown -->
    <div v-else class="bg-neutral-400/10 p-4 rounded-xl">
      <h2 class="text-2xl mb-4 flex-grow">New Unit Design</h2>

      <!-- Row 1: Selections -->
      <div class="grid grid-cols-3 gap-8">
        <!-- Step 1: Platform -->
        <div>
          <h3 class="text-xl mb-2">1. Platform</h3>
          <div class="flex flex-wrap gap-2">
            <UiButton
                v-for="p in player.knownTypes.filter((t) => t.class === 'platformType' && possibleDesigns.filter((d) => d.platform.key === t.key).length > 0)"
                :key="p.key"
                @click="newDesign.platform = p"
                :variant="newDesign.platform && newDesign.platform.key === p.key ? 'selected' : 'solid'"
            >
              <UiIcon :icon="p.icon" class="mr-1"/>
              {{ p.name }}
            </UiButton>
          </div>
        </div>

        <!-- Step 2: Equipment -->
        <div>
          <h3 class="text-xl mb-2">2. Equipment</h3>
          <div v-if="newDesign.platform">
            <div v-if="equipmentOptions.length === 0" class="text-slate-400">No compatible equipment</div>
            <div v-else class="flex flex-wrap gap-2">
              <UiButton
                  type="button"
                  v-for="e in equipmentOptions"
                  :key="e.key"
                  @click="newDesign.equipment = e"
                  :variant="newDesign.equipment && newDesign.equipment.key === e.key ? 'selected' : 'solid'"
              >
                <UiIcon :icon="e.icon" class="mr-1"/>
                {{ e.name }}
              </UiButton>
            </div>
          </div>
          <div v-else class="text-slate-400">Select a platform</div>
        </div>

        <!-- Step 3: Name & Elite -->
        <div>
          <h3 class="text-xl mb-2">3. Name</h3>
          <div v-if="equipmentOptions.length === 0" class="text-slate-400">Select equipment</div>
          <div v-else>
            <input name="name" v-model="newDesign.name" class="px-2 rounded-md bg-neutral-400/10 w-full"/>
            <div class="mt-2">
              <UiButton
                  type="button"
                  :variant="newDesign.elite ? 'selected' : 'solid'"
                  @click="newDesign.elite = !newDesign.elite"
              >
                Elite Unit (+10% strength): {{ newDesign.elite ? 'Yes' : 'No' }}
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Stats -->
      <div v-if="newDesign.platform && newDesign.equipment"
           class="grid grid-cols-3 gap-8 border-t border-white/10 pt-3 mt-3">
        <!-- Col 1: Yields -->
        <div>
          <h3 class="text-xl mb-2">Yields</h3>
          <UiYieldList
              :yields="newDesign.platform!.yields.merge(newDesign.equipment!.yields)"
              :as-total="true"
          />
        </div>

        <!-- Col 2: Requires & Specials -->
        <div>
          <h3 class="text-xl mb-2">Requires</h3>
          <UiObjPillList
              :obj-keys="[...newDesign.platform.requires.allTypes, ...newDesign.equipment.requires.allTypes].filter(r => !r.startsWith( 'technologyType:'))"/>
          <h3 class="text-xl mb-2">Special</h3>
          <UiObjPillList :obj-keys="[...newDesign.platform.specials, ...newDesign.equipment.specials]"/>
        </div>

        <!-- Col 3: Actions -->
        <div>
          <h3 class="text-xl mb-2">Actions</h3>
        </div>
      </div>

      <!-- Row 3: Create -->
      <div v-if="newDesign.platform && newDesign.equipment"
           class="col-span-3 text-right"
      >
        <!-- Upgrade -->
        <UiButton v-for="upgradeFrom in upgradeOptions"
                  class="text-lg"
                  @click="manager.create(newDesign.platform, newDesign.equipment, newDesign.name, player)"
        >
          <div>
            Upgrade
            <UiUnitIcon :design="upgradeFrom"/>
            {{ newDesign.name }}
            to
            <UiUnitIcon v-if="newDesign.platform && newDesign.equipment"
                        :design="{platform: newDesign.platform, equipment: newDesign.equipment} as UnitDesign"/>
            {{ newDesign.name }}
            (-{{ newDesign.elite ? 2 : 1 }} Design Points)
          </div>
        </UiButton>

        <!-- Create -->
        <UiButton class="text-lg"
                  :disabled="!newDesign.platform || !newDesign.equipment"
                  @click="newDesign.platform && newDesign.equipment ? manager.create(newDesign.platform, newDesign.equipment, newDesign.name, player) : null"
        >
          <div>
            Create
            <UiUnitIcon v-if="newDesign.platform && newDesign.equipment"
                        :design="{platform: newDesign.platform, equipment: newDesign.equipment} as UnitDesign"/>
            {{ newDesign.name }}
            (-{{ newDesign.elite ? 3 : 2 }} Design Points)
          </div>
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>