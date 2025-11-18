<script setup lang="ts">
import { Citizen, City } from '@/types/gameObjects'
import CityProduction from '@/components/City/CityProduction.vue'
import CityStatus from '@/components/City/CityStatus.vue'
import CityYields from '@/components/City/CityYields.vue'
import CityCitizen from '@/components/City/CityCitizen.vue'
import { useObjectsStore } from '@/stores/objectStore'

const cities = [] as City[]
const objects = useObjectsStore()
</script>

<template>
  <div>
    <div>
      <div>City</div>
      <div :class="`col-span-${Object.keys(cities[0]?.yields ?? 1).length}`">Stats</div>
      <div>Status</div>
      <div>Construction</div>
      <div>Training</div>
      <div>Buildings</div>
      <div>Citizens</div>
      <div>Units</div>
    </div>
    <div v-for="city of cities">
      <div>
        {{ city.name }}
      </div>

      <CityYields :city="city" class="grid"/>

      <CityStatus :city="city"/>

      <CityProduction v-if="city" :city="city"/>
      <div v-else>-</div>

      <CityProduction v-if="city" :city="city"/>
      <div v-else>-</div>

      <div></div>

      <div>
        <CityCitizen v-for="citizenKey of city.citizens"
                     :citizen="objects.getGameObject(citizenKey) as Citizen"
        />
      </div>

      <div></div>

    </div>
  </div>
</template>