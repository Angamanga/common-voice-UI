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
    // Use a token-exchange Lambda URL if provided; otherwise fall back to upstream
    const exchangeUrl = import.meta.env.VITE_TOKEN_EXCHANGE_URL || `${BASE_URL}/auth/token`
    // client_id moved to the secure Lambda environment; frontend does not send it
    const payload = { grant_type: 'client_credentials' }
    const { data } = await axios.post(exchangeUrl, payload)

    // support multiple response shapes
    const access = data.token || data.access_token || data.accessToken
    const ttl = data.expiresIn || data.expires_in || data.expires || 3600
    token.value = access
    expiresAt.value = Date.now() + ttl * 1000
  }

  return { token, expiresAt, isTokenExpired, fetchToken }
})
