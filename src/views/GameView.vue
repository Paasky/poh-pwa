<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import UiElement from '@/components/Ui/UiElement.vue'
import UiButton from '@/components/Ui/UiButton.vue'
import PlayerDetailsModal from '@/components/PlayerDetails/PlayerDetailsModal.vue'
import PlayerDetailsBar from '@/components/PlayerDetails/PlayerDetailsBar.vue'
import { useEncyclopediaStore } from '@/components/Encyclopedia/encyclopediaStore'
import { useAppStore } from '@/stores/appStore'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { icons } from '@/types/icons'
import EncyclopediaModal from '@/components/Encyclopedia/EncyclopediaModal.vue'
import { useRouter } from 'vue-router'
import { initModalStateSync } from '@/router/modalState'
import { WorldManager } from '@/managers/worldManager'

const encyclopedia = useEncyclopediaStore()
const app = useAppStore()
const router = useRouter()

// Fullscreen handling
const gameRootEl = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

function updateFullscreenState () {
  const d: any = document as any
  isFullscreen.value = !!(document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement)
}

async function enterFullscreen () {
  const el: any = gameRootEl.value || document.documentElement
  try {
    if (el.requestFullscreen) {
      // navigationUI: 'hide' is supported in some browsers (like Chrome on desktop)
      await el.requestFullscreen({ navigationUI: 'hide' } as any)
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen()
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen()
    }
  } catch (_) {
    // ignore
  }
}

async function exitFullscreen () {
  const d: any = document as any
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if (d.webkitExitFullscreen) {
      d.webkitExitFullscreen()
    } else if (d.mozCancelFullScreen) {
      d.mozCancelFullScreen()
    } else if (d.msExitFullscreen) {
      d.msExitFullscreen()
    }
  } catch (_) {
    // ignore
  }
}

function toggleFullscreen (set: boolean | null = null) {
  if (set === true) {
    return void enterFullscreen()
  }
  if (set === false) {
    return void exitFullscreen()
  }

  return isFullscreen.value
      ? void exitFullscreen()
      : void enterFullscreen()
}

onMounted(async () => {
  // Warn/prevent accidental unloads (refresh/close tab) while in the game view
  window.addEventListener('beforeunload', onBeforeUnload)

  // Track fullscreen state & go fullscreen on mount
  document.addEventListener('fullscreenchange', updateFullscreenState)
  document.addEventListener('webkitfullscreenchange', updateFullscreenState as any)
  document.addEventListener('mozfullscreenchange', updateFullscreenState as any)
  document.addEventListener('MSFullscreenChange', updateFullscreenState as any)
  updateFullscreenState()
  toggleFullscreen(true)

  // Bootstrap the app data once (types + gameData) before showing the game UI
  await app.init()

  // Create a new world
  new WorldManager().create()

  // Initialize URL/history syncing for modals and tabs/types after data is ready
  initModalStateSync(router)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('fullscreenchange', updateFullscreenState)
  document.removeEventListener('webkitfullscreenchange', updateFullscreenState as any)
  document.removeEventListener('mozfullscreenchange', updateFullscreenState as any)
  document.removeEventListener('MSFullscreenChange', updateFullscreenState as any)
})

function onBeforeUnload (e: BeforeUnloadEvent) {
  e.preventDefault()
}
</script>

<template>
  <Transition name="fade" mode="out-in">
    <!-- Loader Screen -->
    <div v-if="!app.ready" key="loader"
         class="relative w-screen h-screen bg-gray-800 text-slate-100 flex items-center justify-center">
      <div class="text-center">
        <img src="/book.gif" alt="Book">
        <p class="mt-4 text-slate-300">Loading the Pages of History…</p>
      </div>
    </div>

    <!-- Game Screen -->
    <div v-else id="game" key="game" ref="gameRootEl" class="absolute w-screen h-screen bg-gray-100 text-sm"
         :class="{'processing': app.isProcessing}">
      <!-- todo: Game engine -->
      <div id="engine" key="engine" class="absolute top-0 left-0 w-full h-full bg-black/50"/>

      <!-- todo: Game hover tooltip -->

      <!-- Top-left -->
      <PlayerDetailsBar/>

      <!-- Top-right -->
      <UiElement position="top-right" variant="ghost" class="z-50 text-xl">
        <div class="flex gap-1">
          <UiButton tooltip="Encyclopedia" @click="encyclopedia.open()">
            <UiIcon :icon="icons.question"/>
          </UiButton>
          <UiButton :tooltip="isFullscreen ? 'Exit full screen' : 'Full screen'" @click="toggleFullscreen">
            <UiIcon :icon="isFullscreen ? icons.fullscreenExit : icons.fullscreenEnter"/>
          </UiButton>
          <UiButton tooltip="Menu">
            <UiIcon :icon="icons.menu"/>
          </UiButton>
        </div>
      </UiElement>

      <!-- Left-center -->
      <UiElement position="left-center">Ongoing</UiElement>

      <!-- Right-center -->
      <UiElement position="right-center">Notifications</UiElement>

      <!-- Bottom-left -->
      <UiElement position="bottom-left">Map</UiElement>

      <!-- Bottom-center -->
      <UiElement position="bottom-center">Current</UiElement>

      <!-- Bottom-right -->
      <UiElement position="bottom-right">Next</UiElement>

      <!-- Modals  -->
      <PlayerDetailsModal/>
      <EncyclopediaModal/>

    </div>
  </Transition>
</template>

<!--suppress CssUnusedSymbol -->
<style>
/**********************
 Fade transition (loader <-> game)
**********************/
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.processing > * {
  cursor: wait !important;
}
</style>
