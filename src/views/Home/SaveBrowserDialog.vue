<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { saveManager, SaveMeta } from "@/utils/saveManager";
import { formatSaveDate } from "@/helpers/timeFormatter";
import { formatYear } from "@/Common/Objects/Common";
import pkg from "../../../package.json";
import router from "@/router";
import UiButton from "@/components/Ui/UiButton.vue";
import UiIcon from "@/components/Ui/UiIcon.vue";
import UiCols from "@/components/Ui/UiCols.vue";

const open = defineModel<boolean>({ required: true });

const APP_VERSION = pkg.version;
const saves = ref<SaveMeta[]>([]);
const selectedId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

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
  saveManager.delete(id);
  if (selectedId.value === id) selectedId.value = null;
  refreshSaves();
}

const showDeleteConfirm = ref(false);
const saveToDelete = ref<string | null>(null);

function requestDelete(id: string) {
  saveToDelete.value = id;
  showDeleteConfirm.value = true;
}

function confirmDelete() {
  if (saveToDelete.value) {
    deleteSave(saveToDelete.value);
    saveToDelete.value = null;
  }
  showDeleteConfirm.value = false;
}

async function onFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const text = await file.text();
  const data = JSON.parse(text);

  // Basic validation
  if (!data.world || !data.objects) throw new Error("Invalid save file: missing world or objects.");

  saveManager.save(data);
  refreshSaves();
  selectedId.value = data.world.id;

  // Reset input
  target.value = "";
}
</script>

<template>
  <v-dialog v-model="open" max-width="900" scrollable>
    <v-card rounded="lg" height="600">
      <v-card-title class="d-flex align-center">
        Save Games
        <v-spacer />
        <UiButton
          type="secondary"
          text="Upload Save"
          icon="upload"
          @click="fileInput?.click()"
          size="default"
        />
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="onFileUpload"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <UiCols>
          <template #left>
            <!-- Left Pane: List -->
            <v-list class="flex-grow-1" lines="two">
              <v-list-item
                v-for="save in saves"
                :key="save.id"
                :active="selectedId === save.id"
                @click="selectedId = save.id"
              >
                <template #prepend>
                  <UiIcon
                    v-if="save.version !== APP_VERSION"
                    color="warning"
                    icon="alert"
                    title="Version mismatch"
                  />
                  <UiIcon v-else icon="save" />
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
          </template>

          <template #right>
            <!-- Right Pane: Details -->
            <div class="flex-grow-1 d-flex flex-column ga-4 overflow-y-auto">
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
                  <UiButton
                    type="danger"
                    text="Delete"
                    @click="requestDelete(selectedSave.id)"
                    size="default"
                  />
                  <v-spacer />
                  <UiButton
                    type="primary"
                    text="Load Game"
                    @click="loadSave(selectedSave.id)"
                    size="default"
                  />
                </div>
              </template>

              <div v-else class="fill-height d-flex align-center justify-center opacity-50">
                Select a save to see details
              </div>
            </div>
          </template>
        </UiCols>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <UiButton type="text" text="Close" @click="open = false" size="default" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete confirmation dialog -->
  <v-dialog v-model="showDeleteConfirm" max-width="400">
    <v-card rounded="lg">
      <v-card-title class="text-h6">Delete Save</v-card-title>
      <v-card-text>
        Are you sure you want to delete this save? This action cannot be undone.
      </v-card-text>
      <v-card-actions class="justify-end ga-2">
        <UiButton type="text" text="Cancel" @click="showDeleteConfirm = false" size="default" />
        <UiButton type="danger" text="Delete" @click="confirmDelete" size="default" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
