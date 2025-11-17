import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import pluralize from 'pluralize'
import { capitalCase } from 'change-case'
import { TypeObject } from '@/types/typeObjects'
import { ObjectIcon, ObjKey, TypeKey } from '@/types/common'
import { useObjectsStore } from '@/stores/objectStore'
import { icons } from '@/types/icons'

export const useEncyclopediaStore = defineStore('encyclopedia', {
  state: () => ({
    isOpen: false as boolean,
    ready: false as boolean,
    sections: {} as Record<string, Section>,
    openKeys: {} as Record<string, boolean>,
    keyMap: {} as Record<ObjKey, string>,
    current: null as TypeObject | null,
  }),
  actions: {
    init () {
      if (this.ready) return

      const objects = useObjectsStore()
      const sections = {} as Record<ObjKey, Section>
      const keyMap = {} as Record<ObjKey, string>

      // Seed top-level sections and configured concept subsections
      for (const def of sectionMap.top) {
        const topSection = ensureSection(sections, def.name, def.name, def.icon)
        for (const conceptKey of def.concepts) {
          const concept = objects.getTypeObject(conceptKey)
          ensureSection(topSection.sections, conceptKey, conceptTitle(concept.name), concept.icon)
        }
      }

      // Index types and ensure their concept/category sections
      for (const obj of objects.getAllTypes()) {
        const { name: top, icon: topIcon } = topForConcept(obj.concept)
        const topSection = ensureSection(sections, top, top, topIcon)

        const concept = objects.getTypeObject(obj.concept)
        const conceptSection = ensureSection(topSection.sections, obj.concept, conceptTitle(concept.name), concept.icon)

        if (obj.category) {
          const category = objects.getCategoryObject(obj.category)
          const categorySection = ensureSection(conceptSection.sections, obj.category, category.name, category.icon)
          categorySection.types[obj.key] = obj
          keyMap[obj.key] = `${top}.${obj.concept}.${obj.category}.${obj.key}`
        } else {
          conceptSection.types[obj.key] = obj
          keyMap[obj.key] = `${top}.${obj.concept}.${obj.key}`
        }
      }

      this.sections = sections
      this.keyMap = keyMap
      this.ready = true
      console.log('Encyclopedia initialized')
    },
    isKeyOpen (key: string): boolean {
      return this.openKeys[key] === true
    },
    toggle (key: string) {
      if (this.isKeyOpen(key)) {
        this.openKeys[key] = false
      } else {
        this.open(key)
      }
    },
    open (key?: string) {
      // Unified open(): handles both section keys and Type keys
      if (!key) {
        this.isOpen = true
        return
      }

      // If this looks like a Type key (e.g., "conceptType:building")
      if (key.includes('Type:')) {
        const typeKey = key as TypeKey
        this.current = useObjectsStore().getTypeObject(typeKey)
        this.scrollAndOpenType(typeKey)
        this.isOpen = true
        this.scrollIntoViewById(typeKey, 'center')
        this.scrollRightToTop()
        return
      }

      // Otherwise treat as a section key
      this.current = null
      this.openKeys[key] = true
      this.isOpen = true
      this.scrollIntoViewById(key, 'center')
    },
    close () {
      this.isOpen = false
    },

    // Internal action: Ensure all ancestor sections for a type key are open, using keyMap when available
    scrollAndOpenType (key: TypeKey) {
      const path = this.keyMap[key]
      if (path) {
        const parts = path.split('.')
        for (const p of parts.slice(0, -1)) this.openKeys[p] = true
        return
      }
      const obj = useObjectsStore().getTypeObject(key)
      const { name: top } = topForConcept(obj.concept)
      const parts: string[] = [top, obj.concept]
      if (obj.category) parts.push(obj.category)
      for (const p of parts) this.openKeys[p] = true
    },
    // Scroll a DOM element by id into view after the next tick
    scrollIntoViewById (id: string, block: ScrollLogicalPosition = 'center') {
      nextTick(() => {
        const el = document.getElementById(id) as HTMLElement | null
        if (el) el.scrollIntoView({ behavior: 'smooth', block })
      })
    },
    // Scroll the right content pane to the top after next tick
    scrollRightToTop () {
      nextTick(() => {
        const right = document.getElementById('enc-right') as HTMLElement | null
        if (right) right.scrollTo({ top: 0, behavior: 'smooth' })
      })
    },
  }
})

// Helpers to create and ensure sections without duplicating object literals
function newSection (key: string, title: string, icon: ObjectIcon): Section {
  return { key, title, icon, sections: {}, types: {} }
}

function ensureSection (
  parent: Record<string, Section>,
  key: string,
  title: string,
  icon: ObjectIcon,
): Section {
  if (!parent[key]) parent[key] = newSection(key, title, icon)
  return parent[key]
}

export interface Section {
  key: string
  title: string
  icon: ObjectIcon
  sections: Record<ObjKey, Section>
  types: Record<TypeKey, TypeObject>
}

function conceptTitle (cls: string): string {
  const human = capitalCase(cls)
  const base = human.replace(/\s+(Category|Type)$/i, '')
  return base === 'Dogma' ? 'Dogmas' : pluralize(base)
}

const sectionMap = {
  top: [
    {
      name: 'Player', icon: icons.user, concepts: [
        'conceptType:majorCulture',
        'conceptType:minorCulture',
        'conceptType:majorLeader',
        'conceptType:minorLeader',
        'conceptType:heritage',
        'conceptType:trait',
        'conceptType:myth',
        'conceptType:god',
        'conceptType:dogma',
        'conceptType:policy',
        'conceptType:goal',
      ] as TypeKey[],
    },
    {
      name: 'Cities', icon: icons.city, concepts: [
        'conceptType:building',
        'conceptType:improvement',
        'conceptType:route',
        'conceptType:nationalWonder',
        'conceptType:worldWonder',
      ] as TypeKey[],
    },
    {
      name: 'Units', icon: icons.unit, concepts: [
        'conceptType:equipment',
        'conceptType:platform',
        'conceptType:stockpile',
      ] as TypeKey[],
    },
    {
      name: 'Technology', icon: icons.tech, concepts: [
        'conceptType:era',
        'conceptType:technology',
      ] as TypeKey[],
    },
    {
      name: 'World', icon: icons.world, concepts: [
        'conceptType:domain',
        'conceptType:continent',
        'conceptType:ocean',
        'conceptType:region',
        'conceptType:climate',
        'conceptType:terrain',
        'conceptType:elevation',
        'conceptType:feature',
        'conceptType:resource',
        'conceptType:naturalWonder',
      ] as TypeKey[],
    },
    {
      name: 'Other', icon: icons.concept, concepts: [] as TypeKey[],
    },
  ]
}

// Resolve the top-level section for a given concept key based on sectionMap.top
function topForConcept (conceptKey: TypeKey): { name: string, icon: ObjectIcon } {
  const def = sectionMap.top.find(t => t.concepts.includes(conceptKey))
  if (def) return { name: def.name, icon: def.icon }
  // Fallback to Other
  const other = sectionMap.top.find(t => t.name === 'Other')
  return { name: 'Other', icon: other ? other.icon : icons.concept }
}

