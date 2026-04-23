import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth'

export const BASE_URL =
  import.meta.env.DEV
    ? '/cv-api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://api.commonvoice.mozilla.org')

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const authStore = useAuthStore()

  if (authStore.isTokenExpired) {
    await authStore.fetchToken()
  }

  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  return config
})

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      useAuthStore().$patch({ token: null, expiresAt: null })
    }
    return Promise.reject(err)
  },
)

export default api
