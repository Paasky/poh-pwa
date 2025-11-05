<script setup lang="ts">
import { computed } from 'vue'
import UiButton, { Variant } from '@/components/Ui/UiButton.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { icons } from '@/types/icons'

// Define props with default values
const props = defineProps<{
  title?: string
  disabled?: boolean
  selected?: boolean
  bgColor?: string
  canOpen?: boolean
  buttonText?: string
  buttonVariant?: Variant
}>()

// Emit event to notify parent when the inner button is clicked
const emit = defineEmits<{
  (e: 'button-click'): void
}>()

const isOpen = defineModel('isOpen', { type: Boolean, default: true })

const bgColor2 = computed(() => props.bgColor || (props.disabled ? 'bg-neutral-800' : 'bg-green-950'))
</script>

<template>
  <div
      class="px-2 py-1 rounded-lg flex-grow border flex flex-col"
      :class="[
          bgColor2,
          selected ? 'border-yellow-900' : 'border-neutral-700',
          canOpen ? 'cursor-pointer' : '',
          isOpen ? '' : 'h-8',
      ]"
      @click.stop="canOpen && (isOpen = !isOpen)"
  >
    <div class="text-sm">
      <div class="flex  mb-1"
           :class="isOpen ? 'border-b border-green-900/25' : ''"
           v-if="canOpen || title || buttonText"
      >
      <span v-if="canOpen">
        <UiIcon v-if="isOpen" :icon="icons.down"/>
        <UiIcon v-else :icon="icons.up"/>
      </span>
        <h3 v-if="title" class="flex-grow">{{ title }}</h3>
        <div v-if="buttonText">
          <UiButton :variant="buttonVariant ?? 'solid'"
                    :disabled="disabled"
                    @click.stop="emit('button-click')"
          >{{ buttonText }}
          </UiButton>
        </div>
      </div>
    </div>
    <div v-if="isOpen" class="flex-1 min-h-0">
      <slot/>
    </div>
  </div>
</template>

<style scoped>

</style>