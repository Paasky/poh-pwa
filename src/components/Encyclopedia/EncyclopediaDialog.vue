<script setup lang="ts">
import { computed, reactive } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import { CategoryObject, TypeObject } from "@/types/typeObjects";
import EncyclopediaMenuItem from "@/components/Encyclopedia/EncyclopediaMenuItem.vue";

const isOpen = defineModel<boolean>();
defineExpose({ open });

const state = reactive({
  current: null as null | MenuItem,
  openSections: [] as string[],
  search: "",
  status: "",
});

export type MenuItem = {
  key: string;
  title: string;
  type?: TypeObject;
  children?: Record<string, MenuItem>;
};

const menuObjData = computed(() => {
  const out: Record<string, MenuItem> = {};

  for (const type of useObjectsStore().getAllTypes()) {
    // Build the type item first, then the tree it belongs to
    const typeItem = {
      key: type.key,
      title: type.name,
      type,
    } as MenuItem;

    // Set Concept if doesn't exist already
    if (!out[type.concept]) {
      try {
        const concept = useObjectsStore().getTypeObject(type.concept);
        out[type.concept] = {
          key: type.concept,
          title: concept.name,
          children: {},
        };
      } catch {
        out[type.concept] = {
          key: type.concept,
          title: type.concept,
          children: {},
        };
      }
    }
    const conceptItem = out[type.concept]!;

    // If Type has a category, build a 3-level hierarchy
    if (type.category) {
      if (!conceptItem.children![type.category]) {
        try {
          const category = useObjectsStore().get(type.category) as TypeObject | CategoryObject;
          conceptItem.children![type.category] = {
            key: type.category,
            title: category.name,
            children: {},
          };
        } catch {
          conceptItem.children![type.category] = {
            key: type.category,
            title: type.category,
            children: {},
          };
        }
        conceptItem.children![type.category].children![type.key] = typeItem;
      }
    } else {
      // Type does not have a Category, stay at 2-level hierarchy
      conceptItem.children![type.key] = typeItem;
    }
  }
  return out;
});

function toggle(itemKey: string) {
  if (state.openSections.includes(itemKey)) {
    state.openSections = state.openSections.filter((s) => s !== itemKey);
    return;
  }

  const item = findKeyInData(itemKey);
  if (item) {
    // Has kids -> it's a togglable section
    if (Object.values(item.children ?? {}).length) {
      state.openSections.push(itemKey);
    } else {
      // No kids -> it's an entry
      state.current = item;
    }
  } else {
    state.current = null;
    state.status = `${itemKey} not found`;
  }
}

function open(itemKey: string) {
  isOpen.value = true;
  const item = findKeyInData(itemKey);
  if (item) {
    state.current = item;
  } else {
    state.current = null;
    state.status = `${itemKey} not found`;
  }
}

function findKeyInData(itemKey: string, data?: Record<string, MenuItem>): MenuItem | null {
  // Look in current level
  for (const item of Object.values(data ?? menuObjData.value)) {
    if (item.key === itemKey) {
      return item;
    }
  }

  // Crawl children
  for (const item of Object.values(data ?? menuObjData.value)) {
    if (Object.values(item.children ?? {}).length) {
      const foundItem = findKeyInData(itemKey, item.children);
      if (foundItem) return foundItem;
    }
  }

  // Not found
  return null;
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="72rem" width="90vw" height="90vh">
    <v-card rounded="lg" color="surface" class="d-flex flex-column h-100">
      <!-- Toolbar: Title, Search & Close  -->
      <v-toolbar density="comfortable" color="secondary" class="px-3" style="user-select: none">
        <div class="text-subtitle-1">Encyclopedia</div>
        <v-spacer />
        <v-text-field
          v-model="state.search"
          placeholder="Search"
          prepend-inner-icon="fa-magnifying-glass"
          clearable
          hide-details
          density="compact"
          variant="solo"
          class="mr-2"
        />
        <v-btn icon variant="text" :title="'Close'" @click="isOpen = false">
          <v-icon icon="fa-xmark" />
        </v-btn>
      </v-toolbar>

      <!-- Content: Left menu + right content -->
      <v-card-text class="pa-0 d-flex flex-grow-1 overflow-hidden">
        <!-- Left menu -->
        <div
          class="border-e flex-shrink-0 pb-2"
          style="width: 12rem; user-select: none; overflow-y: auto"
        >
          <EncyclopediaMenuItem
            v-for="item of Object.values(menuObjData)"
            :key="item.key"
            :item="item"
            :open-sections="state.openSections"
            :toggle="toggle"
          />
        </div>

        <!-- Right content -->
        <div class="flex-grow-1 overflow-y-auto pb-4">
          <!-- Nothing selected: Show why, or a loading hero -->
          <div
            v-if="!state.current?.type"
            class="d-flex align-center justify-center"
            style="height: 100%; user-select: none"
          >
            <div class="opacity-10 text-h3 mb-16">{{ state.status || "Pages of History" }}</div>
          </div>

          <!-- Media & Stats -->
          <div v-else class="px-4 d-flex flex-column ga-4">
            <h1>
              {{ state.current.title }} ({{
                useObjectsStore().getTypeObject(state.current.type.concept).name
              }})
            </h1>

            <div class="d-flex ga-4">
              <!-- Media -->
              <v-sheet
                v-if="state.current.type.image"
                width="28rem"
                class="d-flex flex-column ga-4"
              >
                <v-img
                  :src="state.current.type.image"
                  :alt="state.current.title + ' image'"
                  rounded
                />
                <v-card v-if="state.current.type.quote" class="pa-3" rounded variant="tonal">
                  <div style="font-style: italic">
                    {{
                      state.current.type.quote.text ||
                      state.current.type.p1 + " " + state.current.type.p2
                    }}
                  </div>
                  <div class="pt-2" style="font-weight: 600; float: right">
                    <span v-if="state.current.type.quote.source">
                      - {{ state.current.type.quote.source }}
                    </span>
                    <v-icon :icon="'fa-play'" size="x-small" style="cursor: pointer" />
                  </div>
                </v-card>
              </v-sheet>
              <v-sheet
                v-if="!state.current.type.image && state.current.type.description"
                max-width="28rem"
              >
                {{ state.current.type.description }}
              </v-sheet>

              <!-- Stats -->
              <v-card
                variant="outlined"
                class="px-2 pb-3 d-flex flex-column flex-grow-1 ga-2"
                rounded
                style="user-select: none"
              >
                <h2 class="mb-2">Stats</h2>
                <div v-if="state.current.type.category">
                  <h3>Category</h3>
                  <div class="opacity-50">
                    {{
                      (useObjectsStore().get(state.current.type.category) as CategoryObject).name
                    }}
                  </div>
                </div>
                <div v-if="!state.current.type.yields.isEmpty">
                  <h3>Yields</h3>
                  <div
                    v-for="y of state.current.type.yields.all()"
                    :key="JSON.stringify(y)"
                    class="opacity-50"
                  >
                    {{ y.amount }} {{ useObjectsStore().getTypeObject(y.type).name }}
                  </div>
                </div>
                <div v-if="state.current.type.specials.length">
                  <h3>Specials</h3>
                  <div class="opacity-50"></div>
                </div>
                <div v-if="state.current.type.allows.length">
                  <h3>Gains</h3>
                  <div v-for="gain of state.current.type.gains" :key="gain" class="opacity-50">
                    {{ useObjectsStore().getTypeObject(gain).name }}
                  </div>
                </div>
                <div v-if="!state.current.type.requires.isEmpty">
                  <h3>Requires</h3>
                  <div
                    v-for="req of state.current.type.requires.requireAll"
                    :key="req"
                    class="opacity-50"
                  >
                    {{ (useObjectsStore().get(req) as TypeObject).name }}
                  </div>
                  <div
                    v-for="reqAny of state.current.type.requires.requireAny"
                    :key="JSON.stringify(reqAny)"
                    class="opacity-50"
                  >
                    <span v-for="(req, i) of reqAny" :key="req">
                      <span v-if="i > 0"> or </span>
                      {{ (useObjectsStore().get(req) as TypeObject).name }}
                    </span>
                  </div>
                </div>
                <div v-if="state.current.type.allows.length">
                  <h3>Allows</h3>
                  <div v-for="allow of state.current.type.allows" :key="allow" class="opacity-50">
                    {{ useObjectsStore().getTypeObject(allow).name }}
                  </div>
                </div>
                <div v-if="state.current.type.specials.length">
                  <h3>Specials</h3>
                  <div class="opacity-50"></div>
                </div>
                <div v-if="state.current.type.relatesTo.length">
                  <h3>Relates to</h3>
                  <div class="opacity-50"></div>
                </div>
              </v-card>
            </div>

            <!-- Text below (if media present) -->
            <p v-if="state.current.type.image && state.current.type.description">
              {{ state.current.type.description }}
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.border-e {
  border-inline-end: 0.0625rem solid rgba(255, 255, 255, 0.1);
}
.cursor-pointer {
  cursor: pointer;
}
</style>
