import { defineStore } from 'pinia'
import { generatePlayer, Player } from '@/types/playerObjects'

export const usePlayersStore = defineStore('players', {
  state: () => ({
    currentPlayerKey: '',
    players: {} as Record<string, Player>,
  }),
  getters: {
    current: (state) => state.players[state.currentPlayerKey]!,
    init: (state) => () => {
      // Current player
      const player = generatePlayer()
      state.players[player.key] = player
      state.currentPlayerKey = player.key

      // 2nd player
      const player2 = generatePlayer()
      state.players[player2.key] = player2
    }
  }
})
