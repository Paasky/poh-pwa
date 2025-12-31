<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { saveManager, SaveMeta } from "@/utils/saveManager";
import { formatSaveDate } from "@/helpers/timeFormatter";
import { formatYear } from "@/Common/Objects/Common";
import pkg from "../../../package.json";
import router from "@/router";

const open = defineModel<boolean>({ required: true });

const APP_VERSION = pkg.version;
const saves = ref<SaveMeta[]>([]);
const selectedId = ref<string | null>(null);
const fileToUpload = ref<File[]>([]);

const selectedSave = computed(() => saves.value.find((s) => s.id === selectedId.value) || null);

function refreshSaves() {
  saves.value = saveManager.getIndex().sort((a, b) => b.time - a.time);
  if (saves.value.length > 0 && !selectedId.value) {
    selectedId.value = saves.value[0].id;
  }
}

onMounted(() => {
  refreshSaves();
});

async function loadSave(id: string) {
  open.value = false;
  router.push({ path: "/game", query: { saveId: id } });
}

function deleteSave(id: string) {
  if (confirm("Are you sure you want to delete this save?")) {
    saveManager.delete(id);
    if (selectedId.value === id) selectedId.value = null;
    refreshSaves();
  }
}

async function onFileUpload(files: File | File[]) {
  const file = Array.isArray(files) ? files[0] : files;
  if (!file) return;

  const text = await file.text();
  const data = JSON.parse(text);

  // Basic validation
  if (!data.world || !data.objects) throw new Error("Invalid save file: missing world or objects.");

  saveManager.save(data);
  refreshSaves();
  selectedId.value = data.world.id;
  fileToUpload.value = [];
}
</script>

<template>
  <v-dialog v-model="open" max-width="900" scrollable>
    <v-card rounded="lg" height="600">
      <v-card-title class="d-flex align-center">
        Save Games
        <v-spacer />
        <v-file-input
          v-model="fileToUpload"
          label="Upload Save"
          density="compact"
          hide-details
          prepend-icon="fa-file-import"
          variant="outlined"
          color="secondary"
          style="max-width: 16rem"
          accept=".json"
          @update:model-value="onFileUpload"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0 d-flex">
        <!-- Left Pane: List -->
        <v-list class="flex-grow-1 border-e" width="400" lines="two">
          <v-list-item
            v-for="save in saves"
            :key="save.id"
            :active="selectedId === save.id"
            @click="selectedId = save.id"
          >
            <template #prepend>
              <v-icon
                v-if="save.version !== APP_VERSION"
                color="warning"
                icon="fa-circle-exclamation"
                title="Version mismatch"
              />
              <v-icon v-else icon="fa-floppy-disk" />
            </template>

            <v-list-item-title>{{ save.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatSaveDate(save.time) }} • {{ save.worldSize }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item v-if="saves.length === 0">
            <v-list-item-title class="text-center opacity-50">No saves found</v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Right Pane: Details -->
        <div class="flex-grow-1 pa-4 d-flex flex-column ga-4 overflow-y-auto">
          <template v-if="selectedSave">
            <div>
              <div class="text-h6">{{ selectedSave.name }}</div>
              <div class="text-caption opacity-70">ID: {{ selectedSave.id }}</div>
            </div>

            <v-divider />

            <div class="d-flex flex-wrap ga-4">
              <div class="flex-grow-1 border pa-2 rounded">
                <div class="text-caption">Turn</div>
                <div class="text-body-1">{{ selectedSave.turn }}</div>
              </div>
              <div class="flex-grow-1 border pa-2 rounded">
                <div class="text-caption">Year</div>
                <div class="text-body-1">{{ formatYear(selectedSave.year) }}</div>
              </div>
              <div class="flex-grow-1 border pa-2 rounded">
                <div class="text-caption">World Size</div>
                <div class="text-body-1">{{ selectedSave.worldSize }}</div>
              </div>
            </div>

            <div>
              <div class="text-subtitle-2 mb-2">Players</div>
              <v-list density="compact" class="border rounded pa-0">
                <v-list-item v-for="(p, i) in selectedSave.players" :key="i">
                  <v-list-item-title>{{ p.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ p.culture }}</v-list-item-subtitle>
                  <template #append>
                    <v-chip v-if="p.isMet" size="x-small" color="success">Met</v-chip>
                    <v-chip v-else size="x-small">Unmet</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <v-spacer />

            <div class="d-flex ga-2">
              <v-btn color="danger" variant="outlined" @click="deleteSave(selectedSave.id)"
                >Delete</v-btn
              >
              <v-spacer />
              <v-btn color="primary" @click="loadSave(selectedSave.id)">Load Game</v-btn>
            </div>
          </template>

          <div v-else class="fill-height d-flex align-center justify-center opacity-50">
            Select a save to see details
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
