<script setup lang="ts">
import { useObjectsStore } from '@/stores/objectStore'
import UiHeader from '@/components/Ui/UiHeader.vue'
import { computed } from 'vue'
import { UnitDesign } from '@/types/gameObjects'
import UiObjPill from '@/components/Ui/UiObjPill.vue'
import UiButton from '@/components/Ui/UiButton.vue'
import UnitDesigner from '@/components/PlayerDetails/MilitaryTab/UnitDesigner.vue'
import UiUnitIcon from '@/components/Ui/UiUnitIcon.vue'

const objects = useObjectsStore()
const player = objects.getCurrentPlayer()
const designs = computed(() => player.unitDesigns.map(design => objects.getGameObject(design) as UnitDesign))
</script>

<template>
  <div>
    <UiHeader title="Unit Designs" class="mb-4"/>
    <UnitDesigner class="mb-4 mx-auto max-w-4xl"/>
    <table class="mb-4">
      <thead>
      <tr>
        <th>Name</th>
        <th>Platform</th>
        <th>Equipment</th>
        <th>Actions</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="design of designs">
        <td>
          <UiUnitIcon :design="design"/>
          {{ design.name }}
        </td>
        <td>
          <UiObjPill :obj-or-key="design.platform"/>
        </td>
        <td>
          <UiObjPill :obj-or-key="design.equipment"/>
        </td>
        <td>
          <UiButton v-if="design.isActive">Deactivate</UiButton>
          <UiButton v-else>Reactivate</UiButton>
        </td>
      </tr>
      </tbody>
    </table>
    <UiHeader title="Units" class="mb-4"/>
    <div>
      <div v-for="unit of player.units">
        {{ unit }}
      </div>
    </div>
  </div>
</template>
