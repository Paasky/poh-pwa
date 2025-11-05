<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { icons } from '@/types/icons'
import UiTypePillList from '@/components/Ui/UiTypePillList.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import UiYieldList from '@/components/Ui/UiYieldList.vue'
import UiButton from '@/components/Ui/UiButton.vue'
import { useEncyclopediaStore } from '@/components/Encyclopedia/store'
import { useObjectsStore } from '@/stores/objects'

const objects = useObjectsStore()
const encyclopedia = useEncyclopediaStore()
const { current, isOpen } = storeToRefs(encyclopedia)
const currentCategory = computed(() => current.value?.category ? objects.getCategoryObject(current.value.category) : null)

// Track a single audio instance so we can stop it on navigation/close
const audioRef = ref<HTMLAudioElement | null>(null)

function stopAudio () {
  if (audioRef.value) {
    try {
      audioRef.value.pause()
      audioRef.value.currentTime = 0
    } catch {}
    audioRef.value = null
  }
}

function playQuote () {
  if (!current.value) return
  // Stop any existing playback before starting a new one
  stopAudio()
  const src = `/media/quotes/${current.value.class}/${current.value.id}.mp3`
  const audio = new Audio(src)
  audioRef.value = audio
  audio.play().catch(() => {})
  audio.addEventListener('ended', () => {
    if (audioRef.value === audio) audioRef.value = null
  })
}

// Stop audio when switching to another encyclopedia item
watch(current, () => stopAudio())
// Stop audio when the encyclopedia modal is closed
watch(isOpen, (open) => { if (!open) stopAudio() })
// Safety: stop on unmount
onBeforeUnmount(() => stopAudio())
</script>

<template>
  <div v-if="!current"></div>
  <div v-else class="grid grid-cols-3 gap-4">
    <!-- Description -->
    <div class="col-span-2">
      <div class="flex mb-4 items-center">
        <h1 class="text-2xl flex gap-2 flex-grow">
          <UiIcon :icon="current.icon"/>
          {{ current.name }}
          ({{ objects.getTypeObject(current.concept).name }})
        </h1>
        <UiButton v-if="current.quote" variant="pill" tooltip="Open in Wikipedia">
          <a class="font-serif"
             :href="'https://en.wikipedia.org/w/index.php?title=Special:Search&search=' + current.name"
             target="_blank">
            W
          </a>
        </UiButton>
      </div>
      <div class="w-full xl:w-1/2 float-left mr-4 mb-2">
        <img :src="`/media/${current.class}/${current.id}.jpg`" class="w-full rounded-xl mb-2" alt="image"/>
        <div v-if="current.quote" class="bg-gray-100/10 rounded-xl p-4">
          <div class="italic mb-2">
            {{ current.quote.text }}
          </div>
          <div class="text-right whitespace-nowrap opacity-50 cursor-pointer" @click="playQuote" title="Play quote">
            {{ current.quote.source }}
            <UiIcon :icon="icons.play"/>
          </div>
        </div>
        <div v-if="current.p1 && !current.quote" class="bg-gray-100/10 rounded-xl p-4">
          <div class="italic mb-2">
            {{ current.p1 }}
          </div>
          <div class="italic mb-2">
            {{ current.p2 }}
          </div>
        </div>
      </div>
      <div v-if="current.description" class="hyphens-auto">
        {{ current.description }}
      </div>
    </div>

    <!-- Details -->
    <div class="select-none">
      <h2 class="text-2xl">Properties</h2>
      <div v-if="currentCategory" class="mt-4">
        <h3>Category</h3>
        <div>
          <UiIcon :icon="currentCategory.icon"/>
          <span class="ml-1">{{ currentCategory.name }}</span>
        </div>
      </div>
      <div v-if="current.yields.length" class="mt-4">
        <h3>Yields</h3>
        <UiYieldList :yields="current.yields"/>
      </div>
      <div v-if="current.gains.length" class="mt-4">
        <h3>Gains</h3>
        <UiTypePillList :type-keys="current.gains"/>
      </div>
      <div v-if="current.allows.length" class="mt-4">
        <h3>Allows</h3>
        <UiTypePillList :type-keys="current.allows"/>
      </div>
      <div v-if="current.requires.length" class="mt-4">
        <h3>Requires</h3>
        <UiTypePillList :type-keys="current.requires"/>
      </div>
      <div v-if="current.upgradesFrom.length" class="mt-4">
        <h3>Upgrades From</h3>
        <UiTypePillList :type-keys="current.upgradesFrom"/>
      </div>
      <div v-if="current.upgradesTo.length" class="mt-4">
        <h3>Upgrades To</h3>
        <UiTypePillList :type-keys="current.upgradesTo"/>
      </div>
      <div v-if="current.specials.length" class="mt-4">
        <h3>Special</h3>
        <UiTypePillList :type-keys="current.specials"/>
      </div>
      <div v-if="current.relatesTo.length" class="mt-4">
        <h3>Relates To</h3>
        <UiTypePillList :type-keys="current.relatesTo"/>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>