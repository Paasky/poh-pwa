<script setup lang="ts">
import { computed, type PropType } from 'vue'

type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'left-center'
  | 'right-center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

type Variant = 'solid' | 'ghost' | 'danger'

const props = defineProps({
  position: { type: String as PropType<Position>, required: true },
  variant: { type: String as PropType<Variant>, default: 'solid' }
})

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top-left':
      return 'top-0 left-0 border-t-0 border-l-0 rounded-br-lg'
    case 'top-center':
      return 'top-0 left-1/2 -translate-x-1/2 border-t-0 rounded-bl-lg rounded-br-lg'
    case 'top-right':
      return 'top-0 right-0 border-t-0 border-r-0 rounded-bl-lg'
    case 'left-center':
      return 'top-1/2 -translate-y-1/2 left-0 border-l-0 rounded-tr-lg rounded-br-lg'
    case 'right-center':
      return 'top-1/2 -translate-y-1/2 right-0 border-r-0 rounded-tl-lg rounded-bl-lg'
    case 'bottom-left':
      return 'bottom-0 left-0 border-b-0 border-l-0 rounded-tr-lg'
    case 'bottom-center':
      return 'bottom-0 left-1/2 -translate-x-1/2 border-b-0 rounded-tl-lg rounded-tr-lg'
    case 'bottom-right':
      return 'bottom-0 right-0 border-b-0 border-r-0 rounded-tl-lg'
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'solid':
      return 'bg-green-950'
    case 'ghost':
      return 'bg-transparent'
    case 'danger':
      return 'bg-red-700'
  }
})
</script>

<template>
  <div
    class="absolute select-none text-slate-100"
    :class="[positionClasses, variantClasses]"
  >
    <slot />
  </div>
</template>
