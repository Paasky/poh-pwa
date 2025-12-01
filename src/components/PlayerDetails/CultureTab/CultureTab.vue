<script setup lang="ts">
import UiObjPillList from "@/components/Ui/UiObjPillList.vue";
import UiYieldList from "@/components/Ui/UiYieldList.vue";
import UiObjPill from "@/components/Ui/UiObjPill.vue";
import UiCard from "@/components/Ui/UiCard.vue";
import UiCardGrid from "@/components/Ui/UiCardGrid.vue";
import UiCardGroup from "@/components/Ui/UiCardGroup.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import { useObjectsStore } from "@/stores/objectStore";
import UiHeader from "@/components/Ui/UiHeader.vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import UiRequires from "@/components/Ui/UiRequires.vue";

const objects = useObjectsStore();
const player = objects.currentPlayer;
const culture = player.culture.value;
const region = culture.region.value;
</script>

<template>
  <div>
    <UiHeader
      :title="`${culture.type.value.name} (${region.name}, ${objects.getCategoryObject(culture.type.value.category!).name})`"
      :type="region"
    />
    <div class="px-4 py-2 flex gap-8">
      <img
        :src="player.leader.value.image!"
        class="w-[20rem] h-[20rem] mb-2 mr-2 rounded-xl"
        :alt="player.leader.value.name"
      >
      <div>
        <h3
          class="text-xl select-none text-yellow-800 hover:text-yellow-600 cursor-pointer"
          @click="useEncyclopediaStore().open(player.leader.value.key)"
        >
          {{ player.leader.value.name }}
        </h3>
        <p>{{ player.leader.value.description! }}</p>
      </div>
      <div>
        <h3
          class="text-xl select-none text-yellow-800 hover:text-yellow-600 cursor-pointer"
          @click="useEncyclopediaStore().open(culture.type.value.key)"
        >
          {{ culture.type.value.name }}
        </h3>
        <p>{{ culture.type.value.description! }}</p>
      </div>
    </div>

    <!-- Trait selection -->
    <div
      v-if="culture.status.value === 'settled'"
      class="mb-4"
    >
      <UiHeader
        title="Traits"
        type="conceptType:trait"
      />
      <div class="p-4">
        <UiButton
          v-if="
            culture.mustSelectTraits.value.positive +
              culture.mustSelectTraits.value.negative ===
              0
          "
          @click="culture.evolve()"
        >
          Evolve
        </UiButton>

        <div class="text-sm grid gap-2 mt-4 mb-4">
          <p
            v-if="
              culture.mustSelectTraits.value.positive +
                culture.mustSelectTraits.value.negative
            "
          >
            You must select
            <b v-if="culture.mustSelectTraits.value.positive">{{ culture.mustSelectTraits.value.positive }} positive</b>
            <span
              v-if="
                culture.mustSelectTraits.value.positive &&
                  culture.mustSelectTraits.value.negative
              "
            >
              and
            </span>
            <b v-if="culture.mustSelectTraits.value.negative">{{ culture.mustSelectTraits.value.negative }} negative</b>
            <UiObjPill
              obj-or-key="conceptType:trait"
              :name="
                culture.mustSelectTraits.value.positive +
                  culture.mustSelectTraits.value.negative ===
                  1
                  ? 'Trait'
                  : 'Traits'
              "
            />
            for your Culture. These can only be modified during a
            <UiObjPill obj-or-key="conceptType:revolution" />
            .
          </p>
          <p v-else>
            You have selected all of your
            <UiObjPill
              obj-or-key="conceptType:trait"
              name="Traits"
            />
            . They can only be modified during a
            <UiObjPill obj-or-key="conceptType:revolution" />
            .
          </p>
        </div>
        <UiCardGrid
          gap="gap-x-6 gap-y-4"
          :cols="[
            '2xl:grid-cols-4',
            'lg:grid-cols-3',
            'sm:grid-cols-2',
            'grid-cols-1',
          ]"
        >
          <UiCardGroup
            v-for="catData in objects.getClassTypesPerCategory('traitType')"
            :key="catData.category.key"
          >
            <h3 class="text-center">
              {{ catData.category.name }}
            </h3>
            <div class="flex gap-2 text-center">
              <template
                v-for="(trait, i) of catData.types"
                :key="trait.key"
              >
                <UiCard
                  :title="trait.name"
                  :disabled="!culture.selectableTraits.value.includes(trait)"
                  :selected="culture.traits.value.includes(trait)"
                  @button-click="culture.selectTrait(trait)"
                >
                  <div class="text-xs mt-0.5">
                    <UiYieldList :yields="trait.yields" />
                    <UiObjPillList :obj-keys="trait.gains" />
                  </div>
                  <UiButton
                    v-if="
                      culture.mustSelectTraits.value.positive +
                        culture.mustSelectTraits.value.negative
                    "
                    class="w-full my-1"
                    :disabled="!culture.selectableTraits.value.includes(trait)"
                    @click.stop="culture.selectTrait(trait)"
                  >
                    {{
                      culture.traits.value.includes(trait)
                        ? "Selected"
                        : "Select"
                    }}
                  </UiButton>
                </UiCard>
                <h4
                  v-if="i === 0"
                  class="content-center text-sm italic"
                >
                  or
                </h4>
              </template>
            </div>
          </UiCardGroup>
        </UiCardGrid>
      </div>
    </div>

    <!-- Heritage selection -->
    <div>
      <UiHeader
        title="Heritage"
        type="conceptType:heritage"
      />
      <div class="p-4">
        <UiButton
          v-if="['canSettle', 'mustSettle'].includes(culture.status.value)"
          @click="culture.settle()"
        >
          Settle City
        </UiButton>

        <!-- Not yet settled -->
        <div
          v-if="culture.status.value !== 'settled'"
          class="text-sm grid gap-2 mb-4"
        >
          <p
            v-if="
              culture.status.value === 'notSettled' ||
                culture.status.value === 'canSettle'
            "
          >
            Explore your surroundings to discover and learn from the nature
            around you. These skills will stay as your Cultural
            <UiObjPill obj-or-key="conceptType:heritage" />
            for the rest of the game.
          </p>
          <p v-if="culture.status.value === 'notSettled'">
            You must select at least <b>two Heritages</b> to settle your first
            city.
          </p>
          <h2
            v-if="
              culture.status.value === 'canSettle' ||
                culture.status.value === 'mustSettle'
            "
            class="text-lg my-2"
          >
            <b>You are ready to settle your first city!</b>
          </h2>
          <p
            v-if="
              culture.status.value === 'canSettle' ||
                culture.status.value === 'mustSettle'
            "
          >
            Use your <b>Tribe</b> to create your first
            <UiObjPill obj-or-key="conceptType:city" />
            and turn the first page of your people's history.
          </p>
          <p v-if="culture.status.value === 'canSettle'">
            Settling down will lock your current Heritage for the rest of the
            game.
          </p>
          <p v-if="culture.status.value === 'mustSettle'">
            Your Heritage is full, so exploration will not grant you any more
            points.
          </p>
        </div>
        <UiCardGrid
          v-if="
            culture.status.value === 'notSettled' ||
              culture.status.value === 'canSettle'
          "
        >
          <UiCardGroup
            v-for="catData in objects.getClassTypesPerCategory('heritageType')"
            :key="catData.category.key"
          >
            <div>
              {{ catData.category.name }} ({{
                culture.heritageCategoryPoints.value[catData.category.key!] ??
                  0
              }})
              <h4
                v-if="
                  culture.status.value === 'notSettled' ||
                    culture.status.value === 'canSettle'
                "
                class="inline pl-1 text-xs"
              >
                Get points from:

                <UiButton
                  @click="culture.addHeritagePoints(catData.category.key, 10)"
                >
                  +10 p
                </UiButton>
              </h4>
              <div
                v-if="
                  culture.status.value === 'notSettled' ||
                    culture.status.value === 'canSettle'
                "
                class="text-xs"
              >
                <UiRequires
                  :requires="catData.types[0].requires"
                  :no-margin="true"
                />
              </div>
            </div>
            <UiCard
              v-for="type of catData.types"
              :key="type.key"
              :title="`${type.name} (${type.heritagePointCost!})`"
              :disabled="
                !culture.selectableHeritages.value.includes(type) ||
                  culture.heritages.value.includes(type)
              "
              :selected="culture.heritages.value.includes(type)"
              :can-open="true"
              :is-open="
                culture.selectableHeritages.value.includes(type) ||
                  culture.heritages.value.includes(type)
              "
              :button-text="
                culture.heritages.value.includes(type) ? 'Selected' : 'Select'
              "
              :button-variant="
                culture.heritages.value.includes(type) ? 'selected' : 'solid'
              "
              class="my-1"
              @button-click="
                culture.selectableHeritages.value.includes(type)
                  ? culture.selectHeritage(type)
                  : null
              "
            >
              <div class="text-xs">
                <UiYieldList
                  :yields="type.yields.not(['yieldType:heritagePointCost'])"
                />
                <UiObjPillList :obj-keys="type.gains" />
              </div>
            </UiCard>
          </UiCardGroup>
        </UiCardGrid>

        <!-- Settled -->
        <UiCardGrid v-else>
          <template
            v-for="catData in objects.getClassTypesPerCategory('heritageType')"
          >
            <UiCard
              v-for="type of catData.types.filter((h) =>
                culture.heritages.value.includes(h),
              )"
              :key="type.key"
              :title="type.name"
              class="my-1"
            >
              <div class="text-xs">
                <UiYieldList
                  :yields="type.yields.not(['yieldType:heritagePointCost'])"
                />
                <UiObjPillList :obj-keys="type.gains" />
              </div>
            </UiCard>
          </template>
        </UiCardGrid>
      </div>
    </div>
  </div>
</template>
