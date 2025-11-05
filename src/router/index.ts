import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import GameView from '@/views/GameView.vue'

const routes: Readonly<RouteRecordRaw[]> = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/game', name: 'game', component: GameView }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Prevent leaving the Game route within the SPA (allow in-route query changes like encyclopedia)
router.beforeEach((to, from) => {
  // If we're currently on the game route and trying to go anywhere else, block it
  // Allow staying on the same named route (e.g., query-only changes)
  if (from.name === 'game' && to.name !== 'game') {
    return false // cancel navigation
  }
  return true
})

export default router
