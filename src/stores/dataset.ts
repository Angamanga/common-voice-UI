import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

export interface Accent {
  code: string
  name: string
}

export interface Language {
  code: string
  name: string
  predefined_accents: Accent[]
}

const STORAGE_KEY = 'cv_language'
const CODES_STORAGE_KEY = 'cv_language_codes'

const FALLBACK_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', predefined_accents: [] },
  { code: 'sw', name: 'Swahili', predefined_accents: [] },
  { code: 'sv-SE', name: 'Swedish', predefined_accents: [] },
]

export const useDatasetStore = defineStore('dataset', () => {
  const languages = ref<Language[]>([...FALLBACK_LANGUAGES])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const stored = localStorage.getItem(STORAGE_KEY)
  const storedCodes = localStorage.getItem(CODES_STORAGE_KEY)

  const selectedCode = ref<string>(stored ?? 'sv-SE')
  const selectedCodes = ref<string[]>(
    storedCodes ? JSON.parse(storedCodes) : stored ? [stored] : ['sv-SE'],
  )

  const selectedLanguage = computed(
    () => languages.value.find((l) => l.code === selectedCode.value) ?? languages.value[0] ?? null,
  )

  async function fetchLanguages() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/audio/datasets/codes', {
        params: { service: 'audio', resource: 'scripted' },
      })
      const raw: Array<{
        code: string
        english_name: string
        native_name: string
        predefined_accents?: Accent[]
      }> = Array.isArray(data) ? data : (data.data ?? [])
      if (raw.length > 0) {
        languages.value = raw.map((l) => ({
          code: l.code,
          name: l.code === l.native_name ? l.english_name : l.native_name,
          predefined_accents: l.predefined_accents ?? [],
        }))
      }
    } catch {
      // Keep the fallback list already in place
    } finally {
      loading.value = false
    }
  }

  function selectLanguage(code: string) {
    selectedCode.value = code
    localStorage.setItem(STORAGE_KEY, code)
  }

  function selectLanguages(codes: string[]) {
    selectedCodes.value = codes
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(codes))
    if (codes.length > 0 && !codes.includes(selectedCode.value)) {
      selectLanguage(codes[0])
    }
  }

  return {
    languages,
    selectedCode,
    selectedCodes,
    selectedLanguage,
    loading,
    error,
    fetchLanguages,
    selectLanguage,
    selectLanguages,
  }
})
