/* eslint-disable @typescript-eslint/no-unused-expressions */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import type { Player } from "@/Common/Models/Player";
import { TypeKey } from "@/Common/Objects/Common";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { typeTimeline } from "@/helpers/types";
import { TableColumn } from "@/types/uiComponents";

export const useDiplomacyTabStore = defineStore("diplomacyTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  const players = computed(() => bucket.getClassGameObjects("player") as Player[]);
  const current = ref<Player | null>(null);

  const columns = ref<TableColumn<Player>[]>([
    { title: "Name", key: "name", value: (p: Player) => p.name },
    { title: "Culture", key: "culture", value: (p: Player) => p.culture.type.name },
    { title: "Leader", key: "leader", value: (p: Player) => p.leader.name },
    {
      title: "State Religion",
      key: "religion",
      value: (p: Player) => p.religion.value?.name ?? "-",
    },
    {
      title: "Agendas",
      key: "agendas",
      align: "end",
      value: (p: Player) => p.agendaKeys.length,
    },
    { title: "Deals", key: "deals", align: "end", value: (p: Player) => p.dealKeys.length },
    {
      title: "Trade Routes",
      key: "tradeRoutes",
      align: "end",
      value: (p: Player) => p.tradeRouteKeys.length,
    },
    { title: "Cities", key: "cities", align: "end", value: (p: Player) => p.cityKeys.length },
    { title: "Units", key: "units", align: "end", value: (p: Player) => p.unitKeys.length },
  ]);

  const cultureTimeline = computed(() => {
    if (!current.value?.culture.type?.value) return [];
    return typeTimeline(current.value.culture.type as TypeObject);
  });

  const leaderTimeline = computed(() => {
    return cultureTimeline.value.map((c) =>
      bucket.getTypeObject(
        c.allows.find((a: string) => a.startsWith("majorLeaderType:")) as TypeKey,
      ),
    );
  });

  function init() {
    if (initialized.value) return;
    current.value = bucket.currentPlayer as Player;

    // Warm up computed values
    players;
    cultureTimeline;
    leaderTimeline;

    initialized.value = true;
  }

  return { initialized, players, current, columns, cultureTimeline, leaderTimeline, init };
});
