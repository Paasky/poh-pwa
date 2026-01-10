import { defineStore } from "pinia";
import type { IconKey } from "@/Common/types/icons";

export type TabId =
  | "economy"
  | "research"
  | "culture"
  | "religion"
  | "diplomacy"
  | "trade"
  | "units"
  | "cities"
  | "government";

type DetailItem = {
  id: TabId;
  label: string;
  icon: IconKey;
  iconColor: string; // theme color key (matches vuetify theme colors)
  text: string;
  effect: { text: string; color?: string };
  tooltip: string;
};

export const playerDetailConfig = [
  {
    id: "economy",
    label: "Economy",
    icon: "coins",
    iconColor: "gold",
    text: "12",
    effect: { text: "-3", color: "red" },
    tooltip: "Economy",
  },
  {
    id: "research",
    label: "Research",
    icon: "tech",
    iconColor: "lightBlue",
    text: "234 (5)",
    effect: { text: "+123" },
    tooltip: "Research: Rifling 234/789 (5 turns)",
  },
  {
    id: "culture",
    label: "Culture",
    icon: "masksTheater",
    iconColor: "lightPurple",
    text: "234 (5)",
    effect: { text: "+123" },
    tooltip: "Culture: 234/789 to next Golden Age  (5 turns)",
  },
  {
    id: "religion",
    label: "Religion",
    icon: "handsPraying",
    iconColor: "darkPurple",
    text: "234 (5)",
    effect: { text: "+123" },
    tooltip: "Religion: 234/789 to next God  (5 turns)",
  },
  {
    id: "diplomacy",
    label: "Diplomacy",
    icon: "scroll",
    iconColor: "lightGray",
    text: "3",
    effect: { text: "5/8", color: "green" },
    tooltip: "Diplomacy: 3 Agendas, 5/8 units in use",
  },
  {
    id: "trade",
    label: "Trade",
    icon: "route",
    iconColor: "orange",
    text: "12",
    effect: { text: "(8)", color: "green" },
    tooltip: "Trade: 12 active routes, 8 available",
  },
  {
    id: "units",
    label: "Units",
    icon: "shield",
    iconColor: "gray",
    text: "4",
    effect: { text: "(6)", color: "green" },
    tooltip: "Units: 4 Available Designs, 6 design points",
  },
  {
    id: "cities",
    label: "Cities",
    icon: "cityAlt",
    iconColor: "white",
    text: "6",
    effect: { text: "8%" },
    tooltip: "Cities: 8% discontent",
  },
  {
    id: "government",
    label: "Government",
    icon: "landmark",
    iconColor: "white",
    text: "Stable",
    effect: { text: "12%" },
    tooltip: "Government: No revolt risk, 12% Corruption",
  },
] as DetailItem[];

export const usePlayerDetailsStore = defineStore("playerDetails", {
  state: () => ({
    isOpen: false as boolean,
    tab: undefined as undefined | TabId,
    // Wired by router/index.ts
    pushTabState: undefined as undefined | ((v: string | undefined) => void),
  }),
  actions: {
    // Public API
    open(tab?: TabId) {
      // Sync to URL via router wiring
      this.pushTabState!(tab ?? "");
    },
    close() {
      this.pushTabState!(undefined);
    },

    // Internal URL -> UI handlers (wired by router)
    _openFromUiState(tab: string) {
      this.isOpen = true;
      this.tab = tab as TabId;
    },
    _clearFromUiState() {
      this.tab = undefined;
      this.isOpen = false;
    },
  },
});
