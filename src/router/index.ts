import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Hash history avoids 404 on reload when hosted on GitHub Pages.
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'profiles', component: () => import('@/views/ProfilesView.vue'), meta: { requiresAuth: true } },
    {
      path: '/child/:id',
      component: () => import('@/views/ChildLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'child', component: () => import('@/views/ChildView.vue') },
        { path: 'payout', name: 'child-payout', component: () => import('@/views/PayoutView.vue') },
        { path: 'earned', name: 'child-earned', component: () => import('@/views/EarnedView.vue') },
        { path: 'settings', name: 'child-settings', component: () => import('@/views/SettingsView.vue') },
      ],
    },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'profiles' }
})

export default router
