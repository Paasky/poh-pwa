import { defineStore } from "pinia";
import { EventSetting, EventType, GameEvent } from "@/types/events";

export const useEventStore = defineStore("events", {
  state: () => ({
    turnEvents: [] as GameEvent[],
    current: null as GameEvent | null,
    eventSettings: {} as Record<EventType, EventSetting>,
  }),
  getters: {
    unreadEvents: (state): GameEvent[] =>
      (state.turnEvents as GameEvent[]).filter((e) => !e.read),
  },
  actions: {
    open(event: GameEvent) {
      if (this.current?.id === event.id) return;

      this.current = event;
    },

    closeCurrent() {
      if (!this.current) throw new Error("No current event");

      this.current.read = true;

      // Move to next unread or close
      const next = this.turnEvents.reverse().find((e) => !e.read);
      if (next) {
        this.current = next;
      } else {
        this.current = null;
      }
    },
  },
});
