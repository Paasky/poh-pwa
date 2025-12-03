<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import EncyclopediaMenuItem from "@/components/Encyclopedia/EncyclopediaMenuItem.vue";
import UiYield from "@/components/Ui/UiYield.vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";
import UiObjectChip from "@/components/Ui/UiObjectChip.vue";
import { useObjectsStore } from "@/stores/objectStore";
import { useAudioStore } from "@/stores/audioStore";
import { CategoryObject, TypeObject } from "@/types/typeObjects";
import { TypeKey } from "@/types/common";

const store = useEncyclopediaStore();
const audio = useAudioStore();
store.$subscribe((mutation) => {
  const storeKey = (mutation.events as { key: string }).key;
  if (storeKey === "current" || storeKey === "isOpen") audio.stopQuote();
});
onBeforeUnmount(() => audio.stopQuote());
</script>

<template>
  <v-dialog
    v-model="store.isOpen"
    max-width="72rem"
    width="90vw"
    height="90vh"
    :close-on-back="false"
  >
    <v-card rounded="lg" color="surface" class="d-flex flex-column h-100">
      <!-- Toolbar: Title, Search & Close  -->
      <v-toolbar density="comfortable" color="secondary" style="user-select: none">
        <div
          class="flex-shrink-0 pl-4 mr-2"
          style="width: 12rem; border-inline-end: 0.0625rem solid rgba(255, 255, 255, 0.1)"
        >
          Encyclopedia
        </div>
        <!-- Search history chips area (placeholder) -->
        <div
          class="flex-grow-1 align-center justify-end ga-2 px-2"
          style="overflow-x: auto; white-space: nowrap"
        >
          <template v-for="term in store.searchHistory.slice().reverse()" :key="term">
            <v-chip
              closable
              @click="store.search = term"
              @click:close.stop="store.removeFromHistory(term)"
              class="mr-1"
            >
              {{ term }}
            </v-chip>
          </template>
        </div>
        <div class="flex-shrink-0" style="width: 24rem">
          <v-text-field
            v-model="store.search"
            placeholder="Search"
            prepend-inner-icon="fa-magnifying-glass"
            clearable
            hide-details
            density="compact"
            variant="solo"
          />
        </div>
        <v-btn icon variant="text" class="flex-shrink-0" :title="'Close'" @click="store.close()">
          <v-icon icon="fa-xmark" />
        </v-btn>
      </v-toolbar>

      <!-- Content: Left menu + right content -->
      <v-card-text class="pa-0 d-flex flex-grow-1 overflow-hidden">
        <!-- Left menu -->
        <div
          class="flex-shrink-0 pb-2"
          style="
            width: 12rem;
            user-select: none;
            overflow-y: auto;
            border-inline-end: 0.0625rem solid rgba(255, 255, 255, 0.1);
          "
        >
          <EncyclopediaMenuItem
            v-for="item of Object.values(store.data)"
            :key="item.key"
            :item="item"
          />
        </div>

        <!-- Right content -->
        <div id="enc-content" class="flex-grow-1 overflow-y-auto pb-4">
          <!-- Breadcrumbs (Vuetify) -->
          <v-breadcrumbs
            v-if="!store.search && store.breadcrumbs.length"
            density="compact"
            :items="
              store.breadcrumbs.map((key) => ({
                title: (useObjectsStore().get(key as TypeKey) as TypeObject).name,
                key,
              }))
            "
            class="opacity-50"
          >
            <template #item="{ item }">
              <v-breadcrumbs-item
                style="cursor: pointer; user-select: none"
                @click="store.open((item as unknown as TypeObject).key)"
              >
                {{ item.title }}
              </v-breadcrumbs-item>
            </template>
            <template #divider>
              <v-icon icon="fa-chevron-right" size="x-small" class="mb-1 opacity-50" />
            </template>
          </v-breadcrumbs>

          <!-- Search results -->
          <div v-if="store.search" class="px-4 py-4">
            <!-- Require at least 3 characters -->
            <template v-if="store.search.length < 3">
              <v-list density="comfortable" rounded>
                <v-list-item title="Type at least 3 characters to search" />
              </v-list>
            </template>
            <template v-else>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-subtitle-1">
                  {{ Math.min(25, store.searchResults!.length)
                  }}{{ store.searchResults!.length > 25 ? "+" : "" }} result{{
                    store.searchResults!.length === 1 ? "" : "s"
                  }}
                </div>
                <v-btn size="small" variant="text" @click="store.search = ''">Clear</v-btn>
              </div>
              <v-list density="comfortable" rounded>
                <template v-if="store.searchResults!.length">
                  <v-list-item
                    v-for="t in store.searchResults"
                    :key="t.key"
                    :title="t.name"
                    :subtitle="useObjectsStore().getTypeObject(t.concept).name"
                    @click="
                      store.addSearchToHistory();
                      store.open(t.key);
                      store.search = '';
                    "
                  >
                    <template #prepend>
                      <v-avatar size="28" color="transparent" variant="text">
                        <v-img v-if="t.image" :src="t.image" :alt="t.name" />
                      </v-avatar>
                    </template>
                  </v-list-item>
                </template>
                <template v-else>
                  <v-list-item title="No results" subtitle="Try a different search" />
                </template>
              </v-list>
            </template>
          </div>

          <!-- Nothing selected: Show why, or a loading hero -->
          <div
            v-else-if="!store.current?.type"
            class="d-flex align-center justify-center"
            style="height: 100%; user-select: none"
          >
            <div class="opacity-10 text-h3 mb-16">{{ store.status || "Pages of History" }}</div>
          </div>

          <!-- Media & Stats -->
          <div v-else class="px-4 d-flex flex-column ga-4">
            <h1>
              {{ store.current.title }} ({{
                useObjectsStore().getTypeObject(store.current.type.concept).name
              }})
            </h1>

            <div class="d-flex ga-4">
              <!-- Media -->
              <v-sheet
                v-if="store.current.type.image"
                width="28rem"
                min-width="28rem"
                class="d-flex d-flex-shrink-0 flex-column ga-4"
              >
                <v-img
                  :src="store.current.type.image"
                  :alt="store.current.title + ' image'"
                  rounded
                />
                <v-card
                  v-if="store.current.type.quote"
                  @click.stop="audio.playQuote(store.current.type.quote.url)"
                  class="pa-3"
                  rounded
                  variant="tonal"
                  style="cursor: pointer"
                >
                  <div style="font-style: italic">
                    {{
                      store.current.type.quote.text ||
                      store.current.type.p1 + " " + store.current.type.p2
                    }}
                  </div>
                  <div class="pt-2 d-flex ga-2" style="font-weight: 600; float: right">
                    <div v-if="store.current.type.quote.source">
                      - {{ store.current.type.quote.source }}
                    </div>
                    <div>
                      <v-icon :icon="'fa-play'" size="x-small" style="margin-bottom: 0.2rem" />
                    </div>
                  </div>
                </v-card>
              </v-sheet>
              <!-- Description on left if no media, or below if media present -->
              <v-sheet
                v-if="!store.current.type.image && store.current.type.description"
                width="28rem"
                min-width="28rem"
                class="d-flex-grow-1"
              >
                {{ store.current.type.description }}
              </v-sheet>

              <!-- Stats -->
              <v-card
                variant="outlined"
                class="px-4 py-2 d-flex flex-column flex-grow-1 ga-2"
                rounded
                style="user-select: none; border: 2px rgba(255, 255, 255, 0.1) solid"
              >
                <div v-if="store.current.type.category">
                  <h3>Category</h3>
                  <div class="opacity-50">
                    {{
                      (useObjectsStore().get(store.current.type.category) as CategoryObject).name
                    }}
                  </div>
                </div>

                <div v-if="!store.current.type.yields.isEmpty" class="d-flex flex-column ga-1">
                  <h3>Yields</h3>
                  <div v-for="y of store.current.type.yields.all()" :key="JSON.stringify(y)">
                    <UiYield :y="y" />
                  </div>
                </div>

                <div v-if="store.current.type.specials.length" class="d-flex flex-column ga-1">
                  <h3>Specials</h3>
                  <UiObjectChips :types="store.current.type.specials" />
                </div>

                <div v-if="store.current.type.gains.length" class="d-flex flex-column ga-1">
                  <h3>Gains</h3>
                  <UiObjectChips :types="store.current.type.gains" />
                </div>

                <div v-if="!store.current.type.requires.isEmpty" class="d-flex flex-column ga-1">
                  <h3>Requires</h3>
                  <UiObjectChips :types="store.current.type.requires.requireAll" />
                  <div
                    v-for="reqAny of store.current.type.requires.requireAny"
                    :key="JSON.stringify(reqAny)"
                  >
                    <span v-for="(req, i) of reqAny" :key="req">
                      <span v-if="i > 0"> or </span>
                      <UiObjectChip :type="req" />
                    </span>
                  </div>
                </div>

                <div v-if="store.current.type.allows.length" class="d-flex flex-column ga-1">
                  <h3>Allows</h3>
                  <UiObjectChips :types="store.current.type.allows" />
                </div>

                <div v-if="store.current.type.relatesTo.length" class="d-flex flex-column ga-1">
                  <h3>Relates to</h3>
                  <UiObjectChips :types="store.current.type.relatesTo" />
                </div>
              </v-card>
            </div>

            <!-- Text below (if media present) -->
            <p v-if="store.current.type.image && store.current.type.description">
              {{ store.current.type.description }}
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
