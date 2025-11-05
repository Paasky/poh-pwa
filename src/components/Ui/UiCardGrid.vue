<script setup lang="ts">

// noinspection JSUnusedGlobalSymbols
withDefaults(defineProps<{
  cols?: string[]
  gap?: string
}>(), {
  cols: () => ['2xl:grid-cols-5', 'xl:grid-cols-4', 'lg:grid-cols-3', 'md:grid-cols-2', 'grid-cols-1'],
  gap: 'gap-2'
})
</script>

<template>
  <div class="grid grid-cols items-stretch" :class="[gap, ...cols]">
    <slot/>
  </div>
</template>

<style scoped>

</style>