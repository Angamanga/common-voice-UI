import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { BASE_URL } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const expiresAt = ref<number | null>(null)

  const isTokenExpired = computed(() => {
    if (!token.value || !expiresAt.value) return true
    return Date.now() >= expiresAt.value - 60_000
  })

  async function fetchToken() {
    const { data } = await axios.post(`${BASE_URL}/auth/token`, {
      clientId: import.meta.env.VITE_CV_CLIENT_ID,
      clientSecret: import.meta.env.VITE_CV_CLIENT_SECRET,
    })
    token.value = data.token
    expiresAt.value = Date.now() + data.expiresIn * 1000
  }

  return { token, expiresAt, isTokenExpired, fetchToken }
})
