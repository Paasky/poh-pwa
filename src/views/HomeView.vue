<script setup lang="ts">
// Home landing view
</script>

<template>
  <main class="min-h-screen flex items-center justify-center text-slate-100">
    <div class="text-center p-6">
      <div class="flex justify-center mb-4">
        <font-awesome-icon
          :icon="['fas', 'book-open']"
          class="text-5xl text-sky-400"
        />
      </div>
      <h1 class="text-4xl sm:text-6xl tracking-tight">
        Pages of History
      </h1>

      <div class="mt-8">
        <RouterLink
          to="/game"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
        >
          Start
        </RouterLink>
        <RouterLink
          to="/generator"
          class="inline-flex items-center gap-2 px-6 py-3 ml-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
        >
          Generator
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped></style>
