/* eslint-disable @typescript-eslint/no-unused-expressions */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import type { Player } from "@/objects/game/Player";
import { TypeKey } from "@/types/common";
import { TypeObject } from "@/types/typeObjects";
import { typeTimeline } from "@/helpers/types";
import { TableColumn } from "@/types/uiComponents";

export const useDiplomacyTabStore = defineStore("diplomacyTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  const players = computed(() => objStore.getClassGameObjects("player") as Player[]);
  const current = ref<Player | null>(null);

  const columns = ref<TableColumn<Player>[]>([
    { title: "Name", key: "name", value: (p: Player) => p.name },
    { title: "Culture", key: "culture", value: (p: Player) => p.culture.value.type.value.name },
    { title: "Leader", key: "leader", value: (p: Player) => p.leader.value.name },
    {
      title: "State Religion",
      key: "religion",
      value: (p: Player) => p.religion.value?.name ?? "-",
    },
    {
      title: "Agendas",
      key: "agendas",
      align: "end",
      value: (p: Player) => p.agendaKeys.value.length,
    },
    { title: "Deals", key: "deals", align: "end", value: (p: Player) => p.dealKeys.value.length },
    {
      title: "Trade Routes",
      key: "tradeRoutes",
      align: "end",
      value: (p: Player) => p.tradeRouteKeys.value.length,
    },
    { title: "Cities", key: "cities", align: "end", value: (p: Player) => p.cityKeys.value.length },
    { title: "Units", key: "units", align: "end", value: (p: Player) => p.unitKeys.value.length },
  ]);

  const cultureTimeline = computed(() => {
    if (!current.value?.culture.type?.value) return [];
    return typeTimeline(current.value.culture.type.value as TypeObject);
  });

  const leaderTimeline = computed(() => {
    return cultureTimeline.value.map((c) =>
      objStore.getTypeObject(
        c.allows.find((a: string) => a.startsWith("majorLeaderType:")) as TypeKey,
      ),
    );
  });

  function init() {
    if (initialized.value) return;
    current.value = objStore.currentPlayer as Player;

    // Warm up computed values
    players.value;
    cultureTimeline.value;
    leaderTimeline.value;

    initialized.value = true;
  }

  return { initialized, players, current, columns, cultureTimeline, leaderTimeline, init };
});
