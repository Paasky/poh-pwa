<script setup lang="ts">
import { reactive } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import { CategoryObject, TypeObject } from "@/types/typeObjects";

// v-model support for open state
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

// outside accessor open(itemKey:string) exposed below

const state = reactive({
  current: null as null | MenuItem,
  openSections: [] as string[],
  search: "",
  status: "",
});

// Temporary hierarchical data
export type MenuItem = {
  key: string;
  title: string;
  image?: string;
  quote?: {
    text: string;
    source?: string;
    url?: string;
  };
  children?: Record<string, MenuItem>;
};

const menuObjData: Record<string, MenuItem> = {};
for (const type of useObjectsStore().getAllTypes()) {
  // Build the type item first, then the tree it belongs to
  const typeItem = {
    key: type.key,
    title: type.name,
    image: type.image,
    quote:
      type.quote || type.p1
        ? {
            text: type.quote?.text ?? type.p1 + " " + type.p2,
            source: type.quote?.source,
            url: type.quote?.url,
          }
        : undefined,
  } as MenuItem;

  if (!menuObjData[type.concept]) {
    try {
      const concept = useObjectsStore().getTypeObject(type.concept);
      menuObjData[type.concept] = {
        key: type.concept,
        title: concept.name,
        children: {},
      };
    } catch {
      menuObjData[type.concept] = {
        key: type.concept,
        title: type.concept,
        children: {},
      };
    }
  }
  const conceptItem = menuObjData[type.concept]!;

  if (type.category) {
    if (!conceptItem.children![type.category]) {
      try {
        const category = useObjectsStore().get(type.category) as TypeObject | CategoryObject;
        menuObjData[type.category] = {
          key: type.category,
          title: category.name,
          children: {},
        };
      } catch {
        menuObjData[type.category] = {
          key: type.category,
          title: type.category,
          children: {},
        };
      }
      menuObjData[type.category].children![type.key] = typeItem;
    }
  } else {
    conceptItem.children![type.key] = typeItem;
  }
}

function toggle(itemKey: string) {
  if (state.openSections.includes(itemKey)) {
    state.openSections = state.openSections.filter((s) => s !== itemKey);
    return;
  }

  const item = findKeyInData(itemKey);
  if (item) {
    // Has kids -> it's a togglable section
    if (item.children?.length) {
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
  emit("update:modelValue", true);
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
  for (const menuItem of Object.values(data ?? menuObjData)) {
    if (menuItem.key === itemKey) {
      return menuItem;
    }
  }

  // Crawl children
  for (const menuItem of Object.values(data ?? menuObjData)) {
    if (menuItem.children?.length) {
      const foundItem = findKeyInData(itemKey, menuItem.children);
      if (foundItem) return foundItem;
    }
  }

  // Not found
  return null;
}
defineExpose({ open });
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    max-width="1400"
  >
    <v-card rounded="lg" color="surface">
      <div style="min-height: 60vh; max-height: 80vh">
        <v-toolbar density="comfortable" class="px-3">
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
            style="width: 512px"
          />
          <v-btn icon variant="text" :title="'Close'" @click="emit('update:modelValue', false)">
            <v-icon icon="fa-xmark" />
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-0 d-flex ga-4 ga-8-sm">
          <!-- Left menu -->
          <div class="border-e" style="width: 512px; overflow: auto">
            <div
              v-for="item of Object.values(menuObjData)"
              :key="item.key"
              class="px-2 py-1 cursor-pointer"
              style="padding-left: 12px"
              @click.stop="toggle(item.key)"
            >
              <div class="d-flex align-center">
                <v-icon
                  v-if="item.children?.length"
                  :icon="state.openSections.includes(item.key) ? 'fa-xmark' : 'fa-bars'"
                  size="x-small"
                  class="mr-1 opacity-50"
                />
                <span class="text-truncate" :title="item.title">{{ item.title }}</span>
              </div>
              <div v-if="item.children?.length && state.openSections.includes(item.key)">
                <div
                  v-for="child of item.children"
                  :key="child.key"
                  class="px-2 py-1"
                  style="padding-left: 12px"
                  @click.stop="toggle(child.key)"
                >
                  <div class="d-flex align-center">
                    <v-icon
                      v-if="child.children?.length"
                      :icon="state.openSections.includes(child.key) ? 'fa-xmark' : 'fa-bars'"
                      size="x-small"
                      class="mr-1 opacity-50"
                    />
                    <span class="text-truncate" :title="child.title">{{ child.title }}</span>
                  </div>
                  <div v-if="child.children?.length && state.openSections.includes(child.key)">
                    <div
                      v-for="grandChild of child.children"
                      :key="grandChild.key"
                      class="px-2 py-1"
                      style="padding-left: 12px"
                      @click.stop="toggle(grandChild.key)"
                    >
                      <div class="d-flex align-center">
                        <v-icon
                          v-if="grandChild.children?.length"
                          :icon="
                            state.openSections.includes(grandChild.key) ? 'fa-xmark' : 'fa-bars'
                          "
                          size="x-small"
                          class="mr-1 opacity-50"
                        />
                        <span class="text-truncate" :title="grandChild.title">{{
                          grandChild.title
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div @click="toggle('invalid')">Invalid</div>
          </div>

          <!-- Right content -->
          <div class="flex-grow-1 d-flex flex-grow" style="overflow: auto">
            <!-- Top bar on right side -->

            <!-- Empty-state placeholder below toolbar -->
            <div v-if="!state.current" class="flex-grow-1 d-flex align-center justify-center">
              <div class="opacity-10 text-h3 mt-10">{{ state.status || "Pages of History" }}</div>
            </div>

            <div v-else class="pa-4 d-flex flex-column ga-4">
              <div class="text-h6">{{ state.current.title }}</div>
              <div class="d-flex ga-4">
                <!-- Article content -->
                <div class="flex-grow-1">
                  <img
                    src="https://cataas.com/cat?square=1"
                    alt="preview"
                    style="
                      float: left;
                      width: 50%;
                      max-width: 512px;
                      height: auto;
                      object-fit: cover;
                      margin-right: 12px;
                      border-radius: 8px;
                    "
                  />
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vitae ante sed
                    justo pretium pretium. Suspendisse potenti. Cras eget velit non ipsum efficitur
                    dignissim. Proin ut augue ut tortor egestas sollicitudin. Donec non ante sit
                    amet lorem ornare cursus. Sed vitae arcu id libero dignissim iaculis. Integer
                    luctus, sem sed efficitur condimentum, nisl dolor consequat magna, vel feugiat
                    velit lorem id ipsum.
                  </p>
                  <p>
                    Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac
                    turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
                    posuere cubilia curae; Donec eu lorem tortor. Nunc sit amet volutpat justo.
                  </p>
                </div>

                <!-- Stats side -->
                <v-sheet
                  class="pa-3"
                  rounded
                  elevation="2"
                  style="width: 512px; background-color: rgba(255, 255, 255, 0.1)"
                >
                  <div class="text-subtitle-1 mb-2">Stats</div>
                  <div class="opacity-70 text-body-2">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi porta auctor
                    luctus.
                  </div>
                </v-sheet>
              </div>
            </div>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.border-e {
  border-inline-end: 1px solid rgba(255, 255, 255, 0.1);
}
.cursor-pointer {
  cursor: pointer;
}
</style>
