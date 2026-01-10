<script setup lang="ts">
import { computed } from "vue";
import { useMapGenStore } from "@/App/stores/mapGenStore";
import { worldSizes } from "@/Common/factories/worldFactory";
import UiRadioButtons from "@/App/components/Ui/UiRadioButtons.vue";
import UiSelect from "@/App/components/Ui/UiSelect.vue";
import UiSlider from "@/App/components/Ui/UiSlider.vue";
import router from "@/App/router";
import UiButton from "@/App/components/Ui/UiButton.vue";
import UiDialog from "@/App/components/Ui/UiDialog.vue";

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
  <UiDialog v-model="open" title="Terra Generator Config" :max-width="600">
    <div class="d-flex flex-column ga-6">
      <UiSelect
        v-model="selectedSize"
        :items="worldSizes"
        item-title="name"
        label="World Size"
        return-object
      />

      <UiRadioButtons v-model="mapGen.config.alignment" label="Alignment" :items="alignmentItems" />

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

    <template #actions>
      <UiButton type="text" text="Cancel" @click="open = false" size="default" />
      <UiButton type="primary" text="Start Game" @click="startGame" size="default" />
    </template>
  </UiDialog>
</template>
