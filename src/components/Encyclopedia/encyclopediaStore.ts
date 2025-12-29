import { defineStore } from "pinia";
import { markRaw, nextTick } from "vue";
import pluralize from "pluralize";
import { capitalCase } from "change-case";
import { CategoryObject, TypeObject } from "@/Common/Objects/TypeObject";
import { useObjectsStore } from "@/stores/objectStore";
import { useAudioStore } from "@/stores/audioStore";

export type MenuItem = {
  key: string;
  title: string;
  type?: TypeObject;
  children?: Record<string, MenuItem>;
};
export const useEncyclopediaStore = defineStore("encyclopedia", {
  state: () => ({
    isOpen: false as boolean,
    current: null as null | MenuItem,
    data: markRaw<Record<string, MenuItem>>({}),
    openSections: [] as string[],
    search: "",
    searchHistory: [] as string[],
    breadcrumbs: [] as string[],
    status: "",

    // To prevent circular dependencies, the router will inject this function
    pushUiState: undefined as undefined | ((key: string | undefined) => void),
  }),
  actions: {
    // Build internal data structure from all types in the game
    // Finally, register to UiState
    init() {
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
            out[type.concept] = {
              key: type.concept,
              title: conceptTitle(type.class),
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
          }
          conceptItem.children![type.category].children![type.key] = typeItem;
        } else {
          // Type does not have a Category, stay at 2-level hierarchy
          conceptItem.children![type.key] = typeItem;
        }
      }
      this.data = markRaw(out);
    },

    // Toggle a menu section
    toggle(itemKey: string) {
      if (this.openSections.includes(itemKey)) {
        this.openSections = this.openSections.filter((s) => s !== itemKey);
        return;
      }

      // Open the section only if it's a valid key
      const item = findKeyInData(itemKey, this.data);
      if (item) {
        this.openSections.push(itemKey);
      } else {
        this.current = null;
        this.status = `${itemKey} not found`;
      }
    },

    // Wrapper for pushUiState -> _openFromUiState to keep state & router in-sync
    open(itemKey: string = "") {
      this.pushUiState!(itemKey);
    },

    // Wrapper for pushUiState -> _closeFromUiState to keep state & router in-sync
    close() {
      this.pushUiState!(undefined);
    },

    // Search handling
    addSearchToHistory(term?: string) {
      const q = (term ?? this.search ?? "").trim();
      if (!q || q.length < 3) return;
      // Avoid duplicates; keep most‑recent first, keep up to 5
      this.searchHistory = [q, ...this.searchHistory.filter((t) => t !== q)].slice(0, 5);
    },
    removeFromHistory(term: string) {
      this.searchHistory = this.searchHistory.filter((t) => t !== term);
    },

    // NOTE: ONLY CALLED BY UI-STATE!
    // Open an item: 1) Breadcrumbs 2) Open in menu 3) Show the item
    _openFromUiState(itemKey: string) {
      this.isOpen = true;
      useAudioStore().stopQuote();

      // Onl asked to open, not to set anything
      if (!itemKey) return;

      // Find the menu item for this key
      const item = findKeyInData(itemKey, this.data, false);
      if (item) {
        // Breadcrumbs: latest open to the end, no duplicates, cap to 5
        const bc = [...this.breadcrumbs.filter((k) => k !== itemKey), itemKey];
        this.breadcrumbs = bc.slice(-5);

        // Open all the parent sections of the item and scroll to the menu entry
        const pathKeys = itemFamilyTree(itemKey, Object.values(this.data));
        for (const pathKey of pathKeys) {
          if (!this.openSections.includes(pathKey)) {
            this.openSections.push(pathKey);
          }
        }

        // Scroll to the entry
        nextTick(() => {
          document
            .getElementById(entryElemId(itemKey))
            ?.scrollIntoView({ block: "center", behavior: "smooth" });
        });

        // Scroll content to top
        nextTick(() =>
          document.getElementById("enc-content")?.scrollTo({ top: 0, behavior: "smooth" }),
        );

        this.current = item;
      } else {
        // Menu item doesn't exist: show the error
        this.current = null;
        this.status = `${itemKey} not found`;
      }
    },

    // NOTE: ONLY CALLED BY UI-STATE!
    _closeFromUiState() {
      this.isOpen = false;
    },
  },
  getters: {
    searchResults(state): null | TypeObject[] {
      if (!state.search || state.search.length < 3) return null;

      // First: add direct name matches
      const nameMatches = {} as Record<string, TypeObject>;
      for (const t of useObjectsStore().getAllTypes()) {
        if (t.name.toLowerCase().includes(state.search.toLowerCase())) nameMatches[t.key] = t;
      }

      // Second find in category, concept & description
      const otherMatches = {} as Record<string, TypeObject>;
      for (const t of useObjectsStore().getAllTypes()) {
        if (t.key in nameMatches) continue;

        const searchIn = [t.category?.split(":")[1], t.concept.split(":")[1], t.description].filter(
          Boolean,
        ) as string[];
        for (const s of searchIn) {
          if (s.toLowerCase().includes(state.search.toLowerCase())) otherMatches[t.key] = t;
        }
      }

      return [
        ...Object.values(nameMatches).sort((a, b) => a.name.localeCompare(b.name)),
        ...Object.values(otherMatches).sort((a, b) => a.name.localeCompare(b.name)),
      ].slice(0, 26);
    },
  },
});

function findKeyInData(
  itemKey: string,
  data: Record<string, MenuItem>,
  allowWithKids = true,
): MenuItem | null {
  // Look in current level
  for (const item of Object.values(data)) {
    if (item.key === itemKey && (allowWithKids || !Object.values(item.children ?? {}).length)) {
      return item;
    }
  }

  // Crawl children
  for (const item of Object.values(data)) {
    if (Object.values(item.children ?? {}).length) {
      const foundItem = findKeyInData(itemKey, item.children!, allowWithKids);
      if (foundItem) return foundItem;
    }
  }

  // Not found
  return null;
}

function itemFamilyTree(itemKey: string, data: MenuItem[]): string[] {
  // If any of the current level's children is me -> current level is the parent
  for (const item of data) {
    const kids = Object.values(item.children ?? {});
    if (kids.some((k) => k.key === itemKey)) {
      return [item.key];
    }
  }

  // Crawl each child recursively
  const path = [] as string[];
  for (const item of data) {
    const kids = Object.values(item.children ?? {});
    const childPath = itemFamilyTree(itemKey, kids);

    // If any of the current item's children's children is me -> current item is the grandparent
    if (childPath.length) {
      path.push(item.key, ...childPath);
    }
  }

  return path;
}

function conceptTitle(cls: string): string {
  const human = capitalCase(cls);
  const base = human.replace(/\s+(Category|Type)$/i, "");
  return base === "Dogma" ? "Dogmas" : pluralize(base);
}
/*
const sectionMap = [
  {
    name: "Player",
    icon: icons.user,
    concepts: [
      "conceptType:majorCulture",
      "conceptType:minorCulture",
      "conceptType:majorLeader",
      "conceptType:minorLeader",
      "conceptType:heritage",
      "conceptType:trait",
      "conceptType:myth",
      "conceptType:god",
      "conceptType:dogma",
      "conceptType:policy",
      "conceptType:goal",
    ] as TypeKey[],
  },
  {
    name: "Cities",
    icon: icons.city,
    concepts: [
      "conceptType:building",
      "conceptType:improvement",
      "conceptType:route",
      "conceptType:nationalWonder",
      "conceptType:worldWonder",
    ] as TypeKey[],
  },
  {
    name: "Units",
    icon: icons.unit,
    concepts: [
      "conceptType:equipment",
      "conceptType:platform",
      "conceptType:stockpile",
    ] as TypeKey[],
  },
  {
    name: "Technology",
    icon: icons.tech,
    concepts: ["conceptType:era", "conceptType:technology"] as TypeKey[],
  },
  {
    name: "WorldState",
    icon: icons.world,
    concepts: [
      "conceptType:domain",
      "conceptType:continent",
      "conceptType:ocean",
      "conceptType:region",
      "conceptType:climate",
      "conceptType:terrain",
      "conceptType:elevation",
      "conceptType:feature",
      "conceptType:resource",
      "conceptType:naturalWonder",
    ] as TypeKey[],
  },
  {
    name: "Other",
    icon: icons.concept,
    concepts: [] as TypeKey[],
  },
];
*/
export const entryElemId = (key: string) => "entry-" + key.replace(":", "-");
export const sectionElemId = (key: string) => "section-" + key.replace(":", "-");
