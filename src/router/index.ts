import { createRouter, createWebHistory } from 'vue-router'
import SpeakView from '@/views/SpeakView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/speak' },
    { path: '/speak', name: 'speak', component: SpeakView },
    { path: '/listen', name: 'listen', component: () => import('@/views/PlaceholderView.vue') },
    { path: '/write', name: 'write', component: () => import('@/views/PlaceholderView.vue') },
    { path: '/review', name: 'review', component: () => import('@/views/PlaceholderView.vue') },
  ],
})

export default router
