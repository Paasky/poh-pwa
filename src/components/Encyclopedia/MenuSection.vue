<script setup lang="ts">
import {
  Section,
  useEncyclopediaStore,
} from "@/components/Encyclopedia/encyclopediaStore";
import UiIcon from "@/components/Ui/UiIcon.vue";

defineProps<{ section: Section }>();
const encyclopedia = useEncyclopediaStore();
</script>

<template>
  <div
    :id="section.elemId"
    class="enc-section select-none rounded-tl-md bg-white/5 cursor-pointer border-b border-black/20"
    @click.stop="encyclopedia.toggle(section.elemId)"
  >
    <div class="px-2 py-1 flex items-center gap-2 min-w-0 hover:bg-white/10">
      <UiIcon :icon="section.icon" />
      <span class="truncate">{{ section.title }}</span>
      <span class="ml-auto w-4 text-center flex-none select-none">
        <span v-if="encyclopedia.isElemOpen(section.elemId)">-</span>
        <span v-else>+</span>
      </span>
    </div>
    <div
      v-if="encyclopedia.isElemOpen(section.elemId)"
      class="pl-4"
    >
      <template v-if="section.sections">
        <MenuSection
          v-for="subSection in section.sections"
          :key="subSection.elemId"
          :section="subSection"
        />
      </template>
      <template v-if="section.types">
        <div
          v-for="type in section.types"
          :id="'enc-type-' + type.key"
          :key="type.key"
          class="type-row select-none cursor-pointer px-2 py-1 first:rounded-tl-md last:rounded-bl-md flex items-center gap-2 min-w-0"
          :class="
            encyclopedia.current?.key === type.key
              ? 'bg-yellow-700 rounded-l'
              : 'bg-white/5 hover:bg-white/10'
          "
          @click.stop="encyclopedia.open(type.key)"
        >
          <UiIcon :icon="type.icon" />
          <span class="truncate">{{ type.name }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/*noinspection CssUnusedSymbol*/
.enc-section:hover:not(:has(.type-row:hover, .enc-section:hover)) {
  /* Tailwind bg-white/10 equivalent */
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
