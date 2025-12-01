<script setup lang="ts">
import { Citizen } from "@/objects/game/Citizen";

defineProps<{ citizen: Citizen }>();
</script>

<template>
  <div class="text-xs text-slate-300">
    <!-- Minimal placeholder to satisfy valid template root rule; real UI pending -->
    <span>{{ citizen.tileKey }}</span>
  </div>
</template>

<style scoped></style>
