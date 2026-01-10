import { defineStore } from "pinia";
import { type EventSetting, type EventType } from "@/Common/types/events";
import { type Construction } from "@/Common/Models/Construction";
import { type Citizen } from "@/Common/Models/Citizen";
import { type Unit } from "@/Common/Models/Unit";
import { type PohEvent } from "@/Common/events/_Event";
import { type TypeKey } from "@/Common/Objects/Common";

export const useEventStore = defineStore("events", {
  state: () => ({
    readyConstructions: [] as Construction[],
    readyCitizens: [] as Citizen[],
    readyUnits: [] as Unit[],
    readyWonders: {} as Record<TypeKey, Construction[]>,

    turnEvents: [] as PohEvent[],
    current: null as PohEvent | null,

    eventSettings: {} as Record<EventType, EventSetting>,
  }),
  getters: {
    unreadEvents: (state): PohEvent[] => (state.turnEvents as PohEvent[]).filter((e) => !e.isRead),
  },
  actions: {
    addReadyWonder(typeKey: TypeKey, construction: Construction) {
      if (this.readyWonders[typeKey]) {
        this.readyWonders[typeKey].push(construction);
      } else {
        this.readyWonders[typeKey] = [construction];
      }
    },

    open(event: PohEvent) {
      if (this.current?.key === event.key) return;

      // eslint-disable-next-line
      this.current = event as any;
    },

    closeCurrent() {
      if (!this.current) throw new Error("No current event");

      this.current.isRead = true;

      // Move to next unread or close
      const next = this.turnEvents.reverse().find((e) => !e.isRead);
      if (next) {
        this.current = next;
      } else {
        this.current = null;
      }
    },

    endTurn() {
      this.readyCitizens = [];
      this.readyConstructions = [];
      this.readyUnits = [];
      this.readyWonders = {};
      this.turnEvents = [];
      this.current = null;
    },
  },
});
