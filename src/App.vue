<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <v-app>
    <v-main>
      <Suspense>
        <RouterView />
      </Suspense>
    </v-main>
  </v-app>
</template>

<style scoped></style>
