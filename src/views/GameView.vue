<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import UiElement from '@/components/Ui/UiElement.vue'
import UiButton from '@/components/Ui/UiButton.vue'
import PlayerDetailsBar from '@/components/PlayerDetails/PlayerDetailsBar.vue'
import { useEncyclopediaStore } from '@/components/Encyclopedia/encyclopediaStore'
import { useAppStore } from '@/stores/appStore'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { icons } from '@/types/icons'
import EncyclopediaModal from '@/components/Encyclopedia/EncyclopediaModal.vue'
import { useRouter } from 'vue-router'
import { initModalStateSync } from '@/router/modalState'
import PlayerDetailsModal from '@/components/PlayerDetails/PlayerDetailsModal.vue'
import EventModal from '@/components/Events/EventModal.vue'
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, DynamicTexture, Color3 } from '@babylonjs/core'

const encyclopedia = useEncyclopediaStore()
const app = useAppStore()
const router = useRouter()

// Fullscreen handling
const gameRootEl = ref<HTMLElement | null>(null)
const engineRootEl = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

// Babylon.js engine state
let babylonEngine: Engine | null = null
let babylonScene: Scene | null = null
let babylonCanvas: HTMLCanvasElement | null = null

function onResize () {
  if (babylonEngine) {
    babylonEngine.resize()
  }
}

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
  window.addEventListener('resize', onResize)

  // Track fullscreen state & go fullscreen on mount
  document.addEventListener('fullscreenchange', updateFullscreenState)
  document.addEventListener('webkitfullscreenchange', updateFullscreenState as any)
  document.addEventListener('mozfullscreenchange', updateFullscreenState as any)
  document.addEventListener('MSFullscreenChange', updateFullscreenState as any)
  updateFullscreenState()
  toggleFullscreen(true)

  // Bootstrap the app data once (types + gameData) before showing the game UI
  await app.init()

  // Initialize URL/history syncing for modals and tabs/types after data is ready
  initModalStateSync(router)

  // Initialize Babylon.js engine on the engine container
  // Wait a tick to ensure the v-else branch (game screen) renders and ref binds
  await nextTick()
  initBabylon()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('fullscreenchange', updateFullscreenState)
  document.removeEventListener('webkitfullscreenchange', updateFullscreenState as any)
  document.removeEventListener('mozfullscreenchange', updateFullscreenState as any)
  document.removeEventListener('MSFullscreenChange', updateFullscreenState as any)

  disposeBabylon()
})

function onBeforeUnload (e: BeforeUnloadEvent) {
  e.preventDefault()
}

function initBabylon () {
  if (babylonEngine) return // already initialized
  const container = engineRootEl.value
  if (!container) return

  // Create and attach canvas
  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  canvas.setAttribute('touch-action', 'none')
  container.appendChild(canvas)
  babylonCanvas = canvas

  // Create Babylon Engine and Scene
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
  const scene = new Scene(engine)
  babylonEngine = engine
  babylonScene = scene

  // Simple camera and light
  const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene)
  camera.attachControl(canvas, true)
  new HemisphericLight('light', new Vector3(0, 1, 0), scene)

  // Add an 8x8 checkerboard ground so something is visible on load
  createCheckerboardPlane(scene)

  // Start render loop
  engine.runRenderLoop(() => {
    scene.render()
  })

  // Ensure correct initial size
  engine.resize()
}

function disposeBabylon () {
  if (babylonEngine) {
    try { babylonEngine.stopRenderLoop() } catch (_) { /* ignore */ }
  }
  if (babylonScene) {
    try { babylonScene.dispose() } catch (_) { /* ignore */ }
  }
  if (babylonEngine) {
    try { babylonEngine.dispose() } catch (_) { /* ignore */ }
  }
  if (babylonCanvas && babylonCanvas.parentElement) {
    try { babylonCanvas.parentElement.removeChild(babylonCanvas) } catch (_) { /* ignore */ }
  }
  babylonCanvas = null
  babylonScene = null
  babylonEngine = null
}

// Creates an 8x8 checkerboard ground centered at the origin
function createCheckerboardPlane (scene: Scene) {
  // Create ground mesh (8x8 world units)
  const ground = MeshBuilder.CreateGround('checkerboard', { width: 8, height: 8, subdivisions: 8 }, scene)

  // Create a dynamic texture with an 8x8 checker pattern
  const texSize = 512
  const squares = 8
  const dt = new DynamicTexture('checkerTexture', { width: texSize, height: texSize }, scene, false)
  const ctx = dt.getContext()
  if (ctx) {
    const squareSize = texSize / squares
    for (let y = 0; y < squares; y++) {
      for (let x = 0; x < squares; x++) {
        const isDark = ((x + y) % 2) === 1
        ctx.fillStyle = isDark ? '#333333' : '#DDDDDD'
        ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize)
      }
    }
    dt.update()
  }

  // Material using the checker texture
  const mat = new StandardMaterial('checkerMat', scene)
  mat.diffuseTexture = dt
  mat.specularColor = Color3.Black() // prevent shiny highlights
  ground.material = mat
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
      <!-- Game engine (Babylon.js mounts a canvas inside this container) -->
      <div id="engine" key="engine" ref="engineRootEl" class="absolute top-0 left-0 w-full h-full bg-black/50"/>

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
      <EventModal/>
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
