import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export interface Demographics {
  email?: string
  username?: string
  age?: string
  gender?: string
  variantCode?: string
  accentCode?: string
  accentCodes?: Record<string, string>
}

export const useUserStore = defineStore('user', () => {
  const STORAGE_KEY = 'cv_user_id'
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const storedId = localStorage.getItem(STORAGE_KEY)
  if (storedId && !UUID_RE.test(storedId)) localStorage.removeItem(STORAGE_KEY)
  const userId = ref<string | null>(storedId && UUID_RE.test(storedId) ? storedId : null)
  const username = ref<string>('User')
  const age = ref<string | null>(null)
  const gender = ref<string | null>(null)
  const variantCode = ref<string | null>(null)
  const accentCodes = ref<Record<string, string>>({})

  async function createUser(demo: Demographics = {}): Promise<{ isNew: boolean }> {
    if (userId.value) return { isNew: false }
    try {
      const { data: raw } = await api.post('/auth/users', demo)
      const data = raw?.data ?? raw
      const id: string = data.userId ?? data.id ?? data.user?.id ?? data.user?.userId
      if (!id) throw new Error(`Unexpected /auth/users response shape: ${JSON.stringify(raw)}`)
      userId.value = id
      if (data.username ?? data.user?.username) {
        username.value = data.username ?? data.user?.username
      }
      localStorage.setItem(STORAGE_KEY, userId.value)
      return { isNew: true }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number; data: Record<string, unknown> & { user?: { userId?: string; id?: string } } } }
      if (axiosErr.response?.status === 409) {
        const d = axiosErr.response.data
        const id = (d.user?.userId ?? d.user?.id ?? d.userId ?? d.id) as string | undefined
        if (!id) throw new Error('409 but no userId in response')
        userId.value = id
        localStorage.setItem(STORAGE_KEY, userId.value)
        return { isNew: false }
      } else {
        throw err
      }
    }
  }

  function setDemographics(demo: Demographics) {
    if (demo.age !== undefined) age.value = demo.age
    if (demo.gender !== undefined) gender.value = demo.gender
    if (demo.variantCode !== undefined) variantCode.value = demo.variantCode
    if (demo.accentCodes !== undefined) accentCodes.value = demo.accentCodes
  }

  function getDemographics(languageCode?: string): Demographics {
    return {
      ...(age.value ? { age: age.value } : {}),
      ...(gender.value ? { gender: gender.value } : {}),
      ...(variantCode.value ? { variantCode: variantCode.value } : {}),
      ...(languageCode && accentCodes.value[languageCode]
        ? { accentCode: accentCodes.value[languageCode] }
        : {}),
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    userId.value = null
    username.value = 'User'
    age.value = null
    gender.value = null
    variantCode.value = null
    accentCodes.value = {}
  }

  return { userId, username, age, gender, variantCode, accentCodes, createUser, setDemographics, getDemographics, logout }
})
