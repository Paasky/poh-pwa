<script setup lang="ts">
import UiElement from "@/components/UiLegacy/UiElement.vue";
import UiValue from "@/components/UiLegacy/UiValue.vue";
import UiIcon from "@/components/UiLegacy/UiIcon.vue";
import { useObjectsStore } from "@/stores/objectStore";
import UiButton from "@/components/UiLegacy/UiButton.vue";
import {
  TabName,
  tabsConfig,
  usePlayerDetailsStore,
} from "@/components/PlayerDetails/playerDetailsStore";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef } from "vue";

type TabData = {
  name: TabName;
  type: TypeObject;
  text: ComputedRef<string>;
  reqSettled: boolean;
  tooltip?: ComputedRef<string>;
  isHidden?: ComputedRef<boolean>;
};

const objects = useObjectsStore();
const player = objects.currentPlayer;
const culture = player.culture.value;
const religion = player.religion?.value;
const modal = usePlayerDetailsStore();

const tabs = tabsConfig.map((tabConfig) => {
  const data = {
    name: tabConfig.name,
    type: objects.getTypeObject(tabConfig.type),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text: undefined as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tooltip: undefined as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isHidden: undefined as any,
    reqSettled: tabConfig.reqSettled,
  };

  if (tabConfig.name === "Economy") {
    data.text = computed((): string => player.storage.amount("yieldType:gold") + "");

    return data as TabData;
  }

  if (tabConfig.name === "Research") {
    data.isHidden = computed(() => culture.status.value !== "settled");
    data.text = computed((): string =>
      player.research.current.value
        ? player.research.getProgress(player.research.current.value as TypeObject) +
          "/" +
          player.research.current.value?.scienceCost +
          ` (${player.research.turnsLeft.value})`
        : "Select",
    );
    data.tooltip = computed(() =>
      player.research.current.value
        ? `Research: ${player.research.current.value.name} (ready in ${player.research.turnsLeft} turns)`
        : "Research: Select next Technology",
    );

    return data as TabData;
  }

  if (tabConfig.name === "Culture") {
    data.text = computed((): string => {
      if (culture.selectableHeritages.value.length) return "Select";
      if (culture.selectableTraits.value.length) return "Select";

      if (culture.status.value === "notSettled") return "Explore";
      if (culture.status.value === "canSettle") return "Can Settle";
      if (culture.status.value === "mustSettle") return "Must Settle";

      return player.storage.amount("yieldType:culture") + "";
    });
    data.tooltip = computed((): string => {
      if (culture.selectableHeritages.value.length) {
        return "Culture: Can select a Heritage";
      }
      if (culture.status.value === "notSettled") {
        return "Culture: Explore your surroundings to gain Heritage Points";
      }
      if (culture.status.value === "canSettle") {
        return "Culture: Can use your Tribe to settle your first City";
      }
      if (culture.status.value === "mustSettle") {
        return "Culture: Use your Tribe to settle your first City";
      }

      if (culture.selectableTraits.value.length) {
        return "Culture: Select Traits for your Culture";
      }

      return culture.type.value.name;
    });

    return data as TabData;
  }

  if (tabConfig.name === "Religion") {
    data.text = computed((): string => {
      if (religion?.canEvolve.value) return "Evolve";
      if (religion?.selectableMyths || religion?.selectableGods || religion?.selectableDogmas)
        return "Select";

      return player.storage.amount("yieldType:faith") + "";
    });
    data.tooltip = computed((): string => {
      if (!religion) return "Religion: No State Religion";
      if (religion.canEvolve.value) return "Religion: Can be evolved";
      if (religion.selectableMyths.value) return "Religion: Cn select a Myth";
      if (religion.selectableGods.value) return "Religion: Cn select a God";
      if (religion.selectableDogmas.value) return "Religion: Cn select a Dogma";

      return religion.name;
    });

    return data as TabData;
  }

  if (tabConfig.name === "Diplomacy") {
    data.text = computed((): string => player.storage.amount("yieldType:influence") + "");
    data.tooltip = computed(
      (): string => `Diplomacy: ${player.storage.amount("yieldType:influence")} influence`,
    );

    return data as TabData;
  }

  if (tabConfig.name === "Cities") {
    data.text = computed((): string => player.cities.value.length + "");
    data.tooltip = computed((): string => `Cities: ${player.cities.value.length}`);

    return data as TabData;
  }

  if (tabConfig.name === "Military") {
    data.text = computed((): string => player.storage.amount("yieldType:designPoints") + "");
    data.tooltip = computed((): string => {
      const points = player.storage.amount("yieldType:designPoints");
      if (points < 2) {
        return `Military: ${points} Design Points (need 2 for new Unit Design)`;
      }

      return `Military: ${points} Design Points (can create a new Unit Design)`;
    });

    return data as TabData;
  }

  if (tabConfig.name === "Trade") {
    data.text = computed((): string => player.tradeRouteKeys.value.length + "");
    data.tooltip = computed(
      (): string => `Trade: ${player.tradeRouteKeys.value.length} active Trade Routes`,
    );

    return data as TabData;
  }

  if (tabConfig.name === "Government") {
    data.text = computed((): string => "Stable");

    return data as TabData;
  }

  throw new Error(`Unknown tab: ${tabConfig.name}`);
}) as TabData[];
</script>

<template>
  <UiElement position="top-left" class="z-50 text-base">
    <div class="flex items-center gap-1 pb-0.5 pr-1">
      <template v-for="tab of tabs" :key="tab.type.key">
        <UiButton
          v-if="!tab.reqSettled || culture.status.value === 'settled'"
          :key="tab.type.key"
          variant="pill"
          :tooltip="tab.tooltip?.value"
          @click="modal.open(tab.name)"
        >
          <UiIcon :icon="tab.type.icon" class="pr-1" />
          <UiValue :value="tab.text.value" />
        </UiButton>
      </template>
    </div>
  </UiElement>
</template>
