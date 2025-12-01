import { defineStore } from "pinia";
import { markRaw, nextTick } from "vue";
import pluralize from "pluralize";
import { capitalCase } from "change-case";
import { TypeObject } from "@/types/typeObjects";
import { ObjectIcon, ObjKey, TypeKey } from "@/types/common";
import { useObjectsStore } from "@/stores/objectStore";
import { icons } from "@/types/icons";

export const useEncyclopediaStore = defineStore("encyclopedia", {
  state: () => ({
    isOpen: false as boolean,
    ready: false as boolean,
    sections: {} as Record<string, Section>,
    openElems: {} as Record<string, boolean>,
    elemMap: {} as Record<string, string[]>,
    current: null as TypeObject | null,
  }),
  actions: {
    init() {
      if (this.ready) throw new Error("Encyclopedia already initialized");

      const objects = useObjectsStore();

      const sections = {} as Record<string, Section>;
      const elemMap = {} as Record<string, string[]>;

      // Build 1st-level group-sections first
      for (const section of sectionMap) {
        sections[section.name] = {
          elemId: "enc-section-" + section.name,
          title: section.name,
          icon: section.icon,
          sections: {} as Record<ObjKey, Section>,
          types: {} as Record<TypeKey, TypeObject>,
        };
      }

      // Build each Type
      for (const type of objects.getAllTypes()) {
        // Find the 1st-level section this type belongs to
        const sectionName =
          sectionMap.find((s) => s.concepts.includes(type.concept))?.name ?? "Other";
        const sectionElemId = "enc-section-" + sectionName;

        // Build/Get a 2nd-level Concept-section
        const conceptElemId = "enc-section-" + type.concept;
        if (!sections[sectionName].sections[type.concept]) {
          const conceptType = objects.getTypeObject(type.concept);
          sections[sectionName].sections[type.concept] = {
            elemId: conceptElemId,
            title: conceptTitle(conceptType.name),
            icon: conceptType.icon,
            sections: {} as Record<ObjKey, Section>,
            types: {} as Record<TypeKey, TypeObject>,
          };

          // To open this Concept-section, also open the top-level
          elemMap[conceptElemId] = [sectionElemId];
        }
        const conceptSection = sections[sectionName].sections[type.concept];

        if (type.category) {
          const category = useObjectsStore().getCategoryObject(type.category);
          const catElemId = "enc-section-" + category.key;

          // Type has a category, so build/get a 3rd-level Category-section
          if (!conceptSection.sections[category.key]) {
            conceptSection.sections[category.key] = {
              elemId: catElemId,
              title: category.name,
              icon: category.icon,
              sections: {} as Record<TypeKey, Section>,
              types: {},
            };

            // To open this category, also open the top-level and 2nd-level concept sections
            elemMap[catElemId] = [sectionElemId, conceptElemId];
          }
          const categorySection = conceptSection.sections[category.key];

          // Add as a 4th-level type
          categorySection.types[type.key] = type;

          // To open this type, also open the top-level, 2nd-level concept and 3rd-level category sections
          elemMap["enc-type-" + type.key] = [sectionElemId, conceptElemId, catElemId];
        } else {
          // No category, so this is a 3rd-level type
          conceptSection.types[type.key] = type;

          // To open this type, also open the top-level and 2nd-level concept sections
          elemMap["enc-type-" + type.key] = [sectionElemId, conceptElemId];
        }
      }

      this.sections = Object.freeze(markRaw(sections));
      this.elemMap = Object.freeze(markRaw(elemMap));

      this.ready = true;
    },
    isElemOpen(elemId: string): boolean {
      return this.openElems[elemId] === true;
    },
    toggle(elemId: string) {
      if (this.isElemOpen(elemId)) {
        this.openElems[elemId] = false;
      } else {
        this._openMenu(elemId, "start");
      }
    },
    open(key?: ObjKey) {
      this.isOpen = true;

      if (!key) {
        return;
      }

      if (key.includes("Type:")) {
        this.current = useObjectsStore().getTypeObject(key as TypeKey);
        this._scrollRightToTop();
        this._openMenu("enc-type-" + key);
      } else {
        this._openMenu("enc-section-" + key);
      }
    },
    close() {
      this.isOpen = false;
    },

    _openMenu(elemId: string, block: ScrollLogicalPosition = "center") {
      this.openElems[elemId] = true;
      this.elemMap[elemId]?.forEach((parentElemId) => (this.openElems[parentElemId] = true));

      // noinspection JSIgnoredPromiseFromCall
      nextTick(() =>
        document.getElementById(elemId)?.scrollIntoView({ behavior: "smooth", block }),
      );
    },

    _scrollRightToTop() {
      // noinspection JSIgnoredPromiseFromCall
      nextTick(() =>
        document.getElementById("enc-right")?.scrollTo({ top: 0, behavior: "smooth" }),
      );
    },
  },
});

export interface Section {
  elemId: string;
  title: string;
  icon: ObjectIcon;
  sections: Record<ObjKey, Section>;
  types: Record<TypeKey, TypeObject>;
}

function conceptTitle(cls: string): string {
  const human = capitalCase(cls);
  const base = human.replace(/\s+(Category|Type)$/i, "");
  return base === "Dogma" ? "Dogmas" : pluralize(base);
}

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
    name: "World",
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
