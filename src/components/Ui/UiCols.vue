<script setup lang="ts"></script>

<template>
  <v-container fluid style="height: 100%">
    <v-row align="stretch" class="responsive-row">
      <v-col cols="12" lg="6">
        <slot name="left" />
      </v-col>

      <!-- Divider -->
      <v-divider vertical class="d-none d-lg-flex"></v-divider>
      <v-divider horizontal class="d-lg-none my-2"></v-divider>

      <v-col cols="12" lg="6">
        <slot name="right" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.responsive-row {
  height: auto; /* default for < lg */
}
@media (min-width: 1280px) {
  /* lg+ */
  .responsive-row {
    height: 100%; /* full container height */
  }
}
</style>
