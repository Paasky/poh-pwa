<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import UiButton from '@/components/Ui/UiButton.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { icons } from '@/types/icons'
import { useAppStore } from '@/stores/app'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  showClose?: boolean
}>(), {
  showClose: true
})

const emit = defineEmits<{ (e: 'close'): void }>()

const app = useAppStore()

function onKey (e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// Dynamically choose the teleport target so overlays remain visible in Fullscreen
const teleportTarget = ref<HTMLElement | string>('body')

function updateTeleportTarget () {
  const d: any = document as any
  teleportTarget.value = (document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement || document.body) as HTMLElement
}

function onFsChange () {
  updateTeleportTarget()
}

onMounted(() => {
  updateTeleportTarget()
  document.addEventListener('fullscreenchange', onFsChange)
  document.addEventListener('webkitfullscreenchange', onFsChange as any)
  document.addEventListener('mozfullscreenchange', onFsChange as any)
  document.addEventListener('MSFullscreenChange', onFsChange as any)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFsChange)
  document.removeEventListener('webkitfullscreenchange', onFsChange as any)
  document.removeEventListener('mozfullscreenchange', onFsChange as any)
  document.removeEventListener('MSFullscreenChange', onFsChange as any)
})
</script>

<template>
  <Teleport :to="teleportTarget">
    <div v-show="open" class="fixed inset-0"
         :class="{'processing': app.isProcessing}">
      <!-- Backdrop -->
      <div
          class="absolute inset-0 bg-black/50"
          @click="emit('close')"
          aria-hidden="true"
      ></div>

      <!-- Panel -->
      <section
          class="absolute left-1/2 top-1/2 mt-2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[100rem] h-[95vh] bg-slate-900 text-slate-100 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="props.title ? 'ui-modal-title' : undefined"
      >
        <!-- Header -->
        <header class="flex items-center gap-2 border-b border-slate-700 bg-green-950 select-none">
          <div class="flex items-center gap-2">
            <slot name="header-left">
              <h2 v-if="props.title" id="ui-modal-title" class="text-lg font-normal px-3 py-1">{{ props.title }}</h2>
            </slot>
          </div>
          <div class="ml-auto flex items-center gap-1">
            <slot name="header-right"/>
            <UiButton v-if="props.showClose" variant="ghost" :tooltip="'Close (Esc)'" @click="emit('close')">
              <UiIcon :icon="icons.close"/>
            </UiButton>
          </div>
        </header>

        <!-- Body -->
        <div class="flex-1 overflow-hidden">
          <slot/>
        </div>
      </section>
    </div>
  </Teleport>
</template>
