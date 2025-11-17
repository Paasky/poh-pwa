<script setup lang="ts">
import { computed, ref } from 'vue'
import UiModal from '@/components/Ui/UiModal.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useEncyclopediaStore } from '@/components/Encyclopedia/encyclopediaStore'
import { useObjectsStore } from '@/stores/objectStore'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Content from '@/components/Encyclopedia/Content.vue'
import MenuSection from '@/components/Encyclopedia/MenuSection.vue'

const objects = useObjectsStore()
const encyclopedia = useEncyclopediaStore()

const query = ref('')
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const allTypes = objects.getAllTypes()

  // Filter by name or description when a query is present
  const byName = allTypes.filter(t => {
    return (t.name.toLowerCase().includes(q))
  }).sort((a, b) => a.name.localeCompare(b.name))

  const byDescription = allTypes.filter(t => {
    return (t.description || '').toLowerCase().includes(q)
  }).sort((a, b) => a.name.localeCompare(b.name))

  // Limit to first 50
  return byName.concat(byDescription)
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 50)
})

function clearQuery () {
  query.value = ''
}
</script>

<template>
  <UiModal :open="encyclopedia.isOpen" title="Encyclopedia" @close="encyclopedia.close()">
    <!-- Search in Headers -->
    <template #header-right>
      <!-- Search box and results dropdown -->
      <div class="relative group">
        <div class="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded px-2 py-1">
          <font-awesome-icon :icon="['fas','magnifying-glass']" class="fa-fw text-slate-400"/>
          <input
              ref="inputEl"
              v-model="query"
              type="search"
              placeholder="Search encyclopedia..."
              class="bg-transparent outline-none placeholder:text-slate-400 text-slate-100 w-64"
          />
          <button
              v-show="query.length > 0"
              type="button"
              class="text-slate-400 hover:text-slate-200"
              aria-label="Clear search"
              title="Clear"
              @click="clearQuery"
          >
            <font-awesome-icon :icon="['fas','xmark']" class="fa-fw"/>
          </button>
        </div>

        <!-- Results panel: purely CSS-driven visibility via focus-within on the wrapper -->
        <div
            v-show="query.length > 0"
            class="hidden group-focus-within:block absolute right-0 mt-1 w-[28rem] max-h-80 overflow-y-auto bg-slate-900 border border-slate-700 rounded shadow-xl"
        >
          <div class="py-1">
            <button
                v-for="t in results"
                :key="t.key"
                type="button"
                class="w-full text-left px-3 py-1.5 hover:bg-slate-800/70 flex items-center gap-2"
                @click="() => {clearQuery(); encyclopedia.open(t.key)}"
            >
              <UiIcon :icon="t.icon"/>
              <span class="truncate">{{ t.name }}</span>
            </button>
            <div v-if="results.length === 0" class="px-3 py-2 text-slate-400">No matches</div>
          </div>
        </div>
      </div>
    </template>

    <div class="w-full h-full flex">
      <!-- Left menu -->
      <aside ref="leftMenuEl" class="w-72 shrink-0 flex-none h-full overflow-y-auto bg-slate-950">
        sports: image in ancient greek pottery style
        sanitation: image in 19th century painting style
        guided ordnance: image in 1980s vhs style

        goals
        tournaments: image in medieval style
        <MenuSection v-for="section of encyclopedia.sections"
                     :key="section.key"
                     :id="'enc-'+section.key"
                     :section="section"
        />
      </aside>

      <!-- Right content -->
      <section id="enc-right" ref="rightContentEl" class="flex-1 min-w-0 h-full overflow-y-auto p-4">
        <Content/>
      </section>
    </div>
  </UiModal>
</template>
