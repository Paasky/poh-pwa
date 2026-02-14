import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import type { Player } from "@/Common/Models/Player";
import { useCurrentContext } from "@/Common/composables/useCurrentContext";
import { TableColumn } from "@/App/components/types";

export const useDiplomacyTabStore = defineStore("diplomacyTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  const players = computed(() => Array.from(bucket.getClassObjects<Player>("player")));
  const current = ref<Player | null>(null);

  const columns = ref<TableColumn<Player>[]>([
    { title: "Name", key: "name", value: (p: Player) => p.name },
    { title: "Culture", key: "culture", value: (p: Player) => p.culture.type.name },
    { title: "Leader", key: "leader", value: (p: Player) => p.leader.name },
    {
      title: "State Religion",
      key: "religion",
      value: (p: Player) => p.religion?.name ?? "-",
    },
    {
      title: "Agendas",
      key: "agendas",
      align: "end",
      value: (p: Player) => p.agendaKeys.size,
    },
    { title: "Deals", key: "deals", align: "end", value: (p: Player) => p.dealKeys.size },
    {
      title: "Trade Routes",
      key: "tradeRoutes",
      align: "end",
      value: (p: Player) => p.tradeRouteKeys.size,
    },
    { title: "Cities", key: "cities", align: "end", value: (p: Player) => p.cityKeys.size },
    { title: "Units", key: "units", align: "end", value: (p: Player) => p.unitKeys.size },
  ]);

  function init() {
    if (initialized.value) return;
    current.value = useCurrentContext().currentPlayer;

    initialized.value = true;
  }

  return { initialized, players, current, columns, init };
});
