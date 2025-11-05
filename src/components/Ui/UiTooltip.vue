<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick, onMounted } from 'vue'
import { computePosition, autoUpdate, offset, flip, shift, type Placement } from '@floating-ui/dom'

const props = withDefaults(defineProps<{
  text: string
  placement?: Placement
  offset?: number
  disabled?: boolean
}>(), {
  placement: 'bottom',
  offset: 6,
  disabled: false
})

const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const open = ref(false)

// Dynamically choose the teleport target so tooltips remain visible in Fullscreen
const teleportTarget = ref<HTMLElement | string>('body')
function updateTeleportTarget() {
  const d: any = document as any
  teleportTarget.value = (document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement || document.body) as HTMLElement
}
function onFsChange() {
  updateTeleportTarget()
}

onMounted(() => {
  updateTeleportTarget()
  document.addEventListener('fullscreenchange', onFsChange)
  document.addEventListener('webkitfullscreenchange', onFsChange as any)
  document.addEventListener('mozfullscreenchange', onFsChange as any)
  document.addEventListener('MSFullscreenChange', onFsChange as any)
})

let cleanup: (() => void) | null = null

function show() {
  if (props.disabled || !props.text) return
  open.value = true
}

function hide() {
  open.value = false
}

watch(open, async (val) => {
  if (val) {
    await nextTick()
    if (triggerRef.value && tooltipRef.value) {
      cleanup?.()
      cleanup = autoUpdate(triggerRef.value, tooltipRef.value, async () => {
        const { x, y } = await computePosition(triggerRef.value!, tooltipRef.value!, {
          placement: props.placement,
          middleware: [offset(props.offset), flip(), shift({ padding: 8 })],
          strategy: 'fixed'
        })
        Object.assign(tooltipRef.value!.style, {
          left: `${x}px`,
          top: `${y}px`
        })
      })
    }
  } else {
    cleanup?.()
    cleanup = null
  }
})

onBeforeUnmount(() => {
  cleanup?.()
  cleanup = null
  document.removeEventListener('fullscreenchange', onFsChange)
  document.removeEventListener('webkitfullscreenchange', onFsChange as any)
  document.removeEventListener('mozfullscreenchange', onFsChange as any)
  document.removeEventListener('MSFullscreenChange', onFsChange as any)
})
</script>

<template>
  <!-- Wrapper that acts as the tooltip trigger -->
  <span
    ref="triggerRef"
    class="inline-block"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
  </span>

  <!-- Tooltip is teleported to the fullscreen element if present, otherwise body -->
  <Teleport :to="teleportTarget">
    <div
      v-show="open"
      ref="tooltipRef"
      role="tooltip"
      class="pointer-events-none z-50 px-2 py-1 rounded-md bg-slate-900 text-slate-100 border border-slate-700 text-xs shadow-lg"
      style="position: fixed; left: 0; top: 0;"
      aria-hidden="false"
    >
      {{ props.text }}
    </div>
  </Teleport>
</template>
