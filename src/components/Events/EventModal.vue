<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useEventStore } from "@/stores/eventStore";
import { useObjectsStore } from "@/stores/objectStore";
import { isTypeObject, PohObject } from "@/types/common";
import { TypeObject } from "@/types/typeObjects";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { icons } from "@/types/icons";
import { Player } from "@/objects/game/Player";
import { GameObject } from "@/objects/game/_GameObject";
import { Culture } from "@/objects/game/Culture";

const events = useEventStore();
const objects = useObjectsStore();

const player = computed((): Player | undefined => events.current?.player as Player | undefined);

const target = computed(
  (): GameObject | PohObject | undefined =>
    events.current?.target as GameObject | PohObject | undefined,
);
const targetType = computed((): TypeObject | undefined => {
  if (!target.value) return undefined;
  if (isTypeObject(target.value)) return target.value;
  if ("type" in target.value) return target.value.type as TypeObject;

  return undefined;
});

const isMe = computed(() => player.value?.key === objects.currentPlayer.key);
const culture = computed((): Culture | undefined => player.value?.culture.value);

// Track a single audio instance so we can stop it on navigation/close
const audioRef = ref<HTMLAudioElement | null>(null);
const autoplayTimer = ref<number | null>(null);

function clearAutoplayTimer() {
  if (autoplayTimer.value != null) {
    clearTimeout(autoplayTimer.value);
    autoplayTimer.value = null;
  }
}

function stopAudio() {
  if (audioRef.value) {
    try {
      audioRef.value.pause();
      audioRef.value.currentTime = 0;
    } catch {
      // Ignore errors when pausing/seeking audio, as it may have already ended
    }
    audioRef.value = null;
  }
}

function playQuote() {
  if (!targetType.value) return;
  // Stop any existing playback before starting a new one
  stopAudio();
  const src = `/media/quotes/${targetType.value.class}/${targetType.value.id}.mp3`;
  const audio = new Audio(src);
  audioRef.value = audio;
  audio.play().catch(() => {});
  audio.addEventListener("ended", () => {
    if (audioRef.value === audio) audioRef.value = null;
  });
}

// Auto-play quote on first open if quote url is truthy, with 500ms delay
watch(
  () => events.current,
  (event) => {
    // Always clear any pending timers when event changes
    clearAutoplayTimer();

    if (event) {
      if (targetType.value?.quote?.url && !event.read) {
        autoplayTimer.value = setTimeout(() => {
          // Ensure the same event is still open
          if (events.current === event) {
            playQuote();
          }
        }, 250);
      }
    } else {
      // Modal closed: stop any playing audio
      stopAudio();
    }
  },
);

function onClose() {
  // Ensure audio and timers are stopped when closing modal
  clearAutoplayTimer();
  stopAudio();
  events.closeCurrent();
}

onUnmounted(() => {
  clearAutoplayTimer();
  stopAudio();
});
</script>

<template>
  <UiModal v-if="events.current" :open="true" size="md" @close="onClose()">
    <div class="px-4 pb-4 items-center flex flex-col">
      <h2
        class="text-2xl select-none text-yellow-800 text-center mt-2 mb-4"
        :class="targetType ? 'hover:text-yellow-600 cursor-pointer' : ''"
        @click="targetType ? useEncyclopediaStore().open(targetType.key) : null"
      >
        {{ (isMe ? "You have " : player ? `${player.name} has ` : "") + events.current.title }}
      </h2>
      <div v-if="targetType" class="grid gap-4 w-[32rem]">
        <div class="flex gap-4 justify-center items-start">
          <img
            v-if="targetType.image"
            :src="targetType.image"
            alt="Target image"
            class="rounded-xl w-[32rem] h-[32rem] float-left"
          />

          <div v-if="player && !isMe" class="max-w-32 bg-gray-100/10 p-2 rounded-xl">
            <img :src="player.leader.value.image" alt="Leader image" class="rounded-xl" />
            <h3
              class="text-xl select-none text-yellow-800 hover:text-yellow-600 cursor-pointer text-center"
              @click="useEncyclopediaStore().open(player.leader.value.key)"
            >
              {{ player.leader.value.name }} ({{ culture!.type.value.name }})
            </h3>
          </div>
        </div>

        <div v-if="targetType.quote" class="bg-gray-100/10 rounded-xl p-4">
          <div v-if="targetType.quote.greeting" class="italic mb-2">
            {{ targetType.quote.greeting }}
          </div>
          <div v-if="targetType.quote.text" class="italic mb-2">
            {{ targetType.quote.text }}
          </div>
          <div v-if="targetType.intro" class="italic mb-2">
            {{ targetType.intro }}
          </div>
          <div v-if="targetType.p1" class="italic mb-2">
            {{ targetType.p1 }}
          </div>
          <div v-if="targetType.p2" class="italic mb-2">
            {{ targetType.p2 }}
          </div>
          <div
            v-if="targetType.quote.source || targetType.quote.url"
            class="text-right whitespace-nowrap opacity-50 cursor-pointer"
            title="Play quote"
            @click="targetType.quote.url ? playQuote() : null"
          >
            <span v-if="targetType.quote.source">{{ targetType.quote.source }}</span>
            <UiIcon v-if="targetType.quote.url" :icon="icons.play" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="events.current.description" class="mt-4">
      {{ events.current.description }}
    </div>
  </UiModal>
</template>

<style scoped></style>
