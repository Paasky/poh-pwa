<script setup lang="ts">
import { RouterView } from "vue-router";
import { Toaster } from "vue-sonner";
</script>

<template>
  <v-app>
    <Toaster position="top-right" rich-colors close-button />
    <v-main>
      <Suspense>
        <RouterView />
      </Suspense>
    </v-main>
  </v-app>
</template>

<style scoped></style>
