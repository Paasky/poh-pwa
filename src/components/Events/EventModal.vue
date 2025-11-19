<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useObjectsStore } from '@/stores/objectStore'
import { isTypeObject, PohObject } from '@/types/common'
import { TypeObject } from '@/types/typeObjects'
import UiModal from '@/components/Ui/UiModal.vue'
import { Culture, Player } from '@/types/gameObjects'
import { useEncyclopediaStore } from '@/components/Encyclopedia/encyclopediaStore'

const events = useEventStore()
const objects = useObjectsStore()

const player = computed(() => events.current?.player ? objects.getGameObject(events.current.player) as Player : undefined)

const target = computed((): PohObject | undefined => events.current?.target ? objects.get(events.current?.target) : undefined)
const targetType = computed((): TypeObject | undefined => {
  if (!target.value) return undefined
  if (isTypeObject(target.value)) return target.value
  if ('type' in target.value) return target.value.type as TypeObject

  return undefined
})

const isMe = computed(() => events.current?.player === objects.getCurrentPlayer().key)
const culture = computed(() => player.value ? objects.getGameObject(player.value.culture) as Culture : undefined)
</script>

<template>
  <UiModal v-if="events.current"
           :open="true"
           :size="targetType?.image && player ? 'md' : 'sm'"
           @close="events.closeCurrent()"
  >
    <h2 class="text-2xl select-none text-yellow-800 text-center mt-2 mb-4">
      {{ (isMe ? 'You have ' : player ? `${player.name} has ` : '') + events.current.title }}
    </h2>
    <div class="grid grid-cols-2 gap-4 center">
      <div v-if="player">
        <img :src="player.leader.image" alt="Leader image" class="rounded-xl"/>
        <h3 class="text-xl select-none text-yellow-800 hover:text-yellow-600 cursor-pointer text-center"
            @click="useEncyclopediaStore().open(player.leader.key)"
        >
          {{ player.leader.name }} ({{ culture!.type.name }})
        </h3>
      </div>
      <div v-if="targetType?.image">
        <img :src="targetType.image" alt="Target image" class="rounded-xl"/>
        <h3 class="text-xl select-none text-yellow-800 hover:text-yellow-600 cursor-pointer text-center"
            @click="useEncyclopediaStore().open(targetType.key)"
        >
          {{ targetType.name }} ({{ objects.getTypeObject(targetType.concept).name }})
        </h3>
      </div>
    </div>
    <div v-if="events.current.description" class="mt-4">
      {{ events.current.description }}
    </div>
  </UiModal>
</template>

<style scoped>
</style>
