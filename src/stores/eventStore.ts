import { defineStore } from 'pinia'
import { GameEvent } from '@/types/events'

export const useEventStore = defineStore('events', {
  state: () => ({
    turnEvents: [] as GameEvent[],
  })
})
