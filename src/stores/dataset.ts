import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Language {
  code: string
  name: string
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv-SE', name: 'Swedish' },
]

const STORAGE_KEY = 'cv_language'

export const useDatasetStore = defineStore('dataset', () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  const validCodes = LANGUAGES.map((l) => l.code)
  const selectedCode = ref<string>(
    stored && validCodes.includes(stored) ? stored : 'sv-SE',
  )

  const selectedLanguage = computed(
    () => LANGUAGES.find((l) => l.code === selectedCode.value) ?? LANGUAGES[0],
  )

  function selectLanguage(code: string) {
    selectedCode.value = code
    localStorage.setItem(STORAGE_KEY, code)
  }

  return { languages: LANGUAGES, selectedCode, selectedLanguage, selectLanguage }
})
