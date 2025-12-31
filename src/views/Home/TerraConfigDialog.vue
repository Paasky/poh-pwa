<script setup lang="ts">
import { computed } from "vue";
import { useMapGenStore } from "@/stores/mapGenStore";
import { worldSizes } from "@/factories/worldFactory";
import UiRadioButtons from "@/components/Ui/UiRadioButtons.vue";
import UiSelect from "@/components/Ui/UiSelect.vue";
import UiSlider from "@/components/Ui/UiSlider.vue";
import router from "@/router";

const open = defineModel<boolean>({ required: true });
const mapGen = useMapGenStore();

const alignments = ["Earth-like", "Mirror X", "Mirror Y", "Mirror Both", "Random"];

const alignmentItems = [
  { title: "Earth-like", value: "Earth-like" },
  { title: "Mirror X", value: "Mirror X" },
  { title: "Mirror Y", value: "Mirror Y" },
  { title: "Mirror Both", value: "Mirror Both" },
  { title: "Random", value: "Random" },
];

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
  router.push("/game");
}
</script>

<template>
  <v-dialog v-model="open" max-width="600">
    <v-card rounded="lg">
      <v-card-title class="text-h5">Terra Generator Config</v-card-title>
      <v-card-text>
        <div class="d-flex flex-column ga-6">
          <UiSelect
            v-model="selectedSize"
            :items="worldSizes"
            item-title="name"
            label="World Size"
            return-object
          />

          <UiRadioButtons
            v-model="mapGen.config.alignment"
            label="Alignment"
            :items="alignmentItems"
          />

          <v-divider />

          <UiSlider
            v-model="mapGen.config.continents"
            :min="4"
            :max="10"
            :step="1"
            label="Continents"
          />

          <UiSlider
            v-model="mapGen.config.majorsPerContinent"
            :min="1"
            :max="4"
            :step="1"
            label="Majors per Continent"
          />

          <UiSlider
            v-model="mapGen.config.minorsPerPlayer"
            :min="0"
            :max="2"
            :step="1"
            label="Minors per Player"
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
