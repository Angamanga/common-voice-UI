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
    const exchangeUrl = import.meta.env.VITE_TOKEN_EXCHANGE_URL || `${BASE_URL}/auth/token`
    const payload: Record<string, string> = { grant_type: 'client_credentials' }

    // When hitting the CV API directly (no Lambda proxy), credentials must be included.
    // In production the Lambda injects them server-side.
    if (!import.meta.env.VITE_TOKEN_EXCHANGE_URL) {
      payload.clientId = import.meta.env.VITE_CV_CLIENT_ID
      payload.clientSecret = import.meta.env.VITE_CV_CLIENT_SECRET
    }

    const { data } = await axios.post(exchangeUrl, payload)

    // support multiple response shapes
    const access = data.token || data.access_token || data.accessToken
    const ttl = data.expiresIn || data.expires_in || data.expires || 3600
    token.value = access
    expiresAt.value = Date.now() + ttl * 1000
  }

  return { token, expiresAt, isTokenExpired, fetchToken }
})
