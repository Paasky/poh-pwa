<script setup lang="ts">
import { computed } from "vue";
import { useMapGenStore } from "@/stores/mapGenStore";
import { useAppStore } from "@/stores/appStore";
import { worldSizes } from "@/factories/worldFactory";

const open = defineModel<boolean>({ required: true });
const mapGen = useMapGenStore();
const app = useAppStore();

const alignments = ["Earth-like", "Mirror X", "Mirror Y", "Mirror Both", "Random"];

const selectedSize = computed({
  get: () => mapGen.config.size,
  set: (val) => {
    mapGen.config.size = val;
    mapGen.config.continents = val.continents;
    mapGen.config.majorsPerContinent = val.majorsPerContinent;
    mapGen.config.minorsPerPlayer = val.minorsPerPlayer;
  },
});

async function startGame() {
  open.value = false;
  app.router.push("/game");
}
</script>

<template>
  <v-dialog v-model="open" max-width="600">
    <v-card rounded="lg">
      <v-card-title class="text-h5">Terra Generator Config</v-card-title>
      <v-card-text>
        <div class="d-flex flex-column ga-4">
          <v-select
            v-model="selectedSize"
            :items="worldSizes"
            item-title="name"
            label="World Size"
            return-object
          />

          <div class="text-subtitle-1">Alignment</div>
          <v-radio-group v-model="mapGen.config.alignment" inline>
            <v-radio v-for="a in alignments" :key="a" :label="a" :value="a" />
          </v-radio-group>

          <v-divider />

          <v-slider
            v-model="mapGen.config.continents"
            min="4"
            max="10"
            step="1"
            label="Continents"
            thumb-label
          />

          <v-slider
            v-model="mapGen.config.majorsPerContinent"
            min="1"
            max="4"
            step="1"
            label="Majors per Continent"
            thumb-label
          />

          <v-slider
            v-model="mapGen.config.minorsPerPlayer"
            min="0"
            max="2"
            step="1"
            label="Minors per Player"
            thumb-label
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" @click="startGame">Start Game</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
