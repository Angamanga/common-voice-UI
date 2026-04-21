import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'
import type { Sentence } from '@/types/api'

export type SentenceStatus = 'pending' | 'recorded' | 'skipped'

export interface SentenceSlot {
  sentence: Sentence
  status: SentenceStatus
}

function offsetKey(languageCode: string) {
  return `cv_sentence_offset_${languageCode}`
}

export const useSentenceStore = defineStore('sentence', () => {
  const slots = ref<SentenceSlot[]>([])
  const activeIndex = ref(0)
  const offset = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeSentence = computed<Sentence | null>(
    () => slots.value[activeIndex.value]?.sentence ?? null,
  )

  const allDone = computed(() =>
    slots.value.length > 0 &&
    slots.value.every((s) => s.status === 'recorded' || s.status === 'skipped'),
  )

  const recordedCount = computed(() => slots.value.filter((s) => s.status === 'recorded').length)

  async function fetchBatch(languageCode: string) {
    loading.value = true
    error.value = null
    // Load this language's persisted offset before fetching
    offset.value = parseInt(localStorage.getItem(offsetKey(languageCode)) ?? '0', 10)
    try {
      const { data } = await api.get('/text/sentences', {
        params: { languageCode, limit: 5, offset: offset.value },
      })
      console.log(`[sentences] ${languageCode} offset=${offset.value}`, data)
      const sentences: Sentence[] = data.data ?? data.sentences ?? data
      slots.value = sentences.map((s) => ({ sentence: s, status: 'pending' }))
      activeIndex.value = 0
      offset.value += 5
      localStorage.setItem(offsetKey(languageCode), String(offset.value))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load sentences'
      throw err
    } finally {
      loading.value = false
    }
  }

  function markRecorded(index: number) {
    if (!slots.value[index]) return
    slots.value[index].status = 'recorded'
    advanceActive(index)
  }

  function markSkipped(index: number) {
    if (!slots.value[index]) return
    slots.value[index].status = 'skipped'
    advanceActive(index)
  }

  function setActiveIndex(index: number) {
    activeIndex.value = index
  }

  function advanceActive(fromIndex: number) {
    const next = slots.value.findIndex((s, i) => i > fromIndex && s.status === 'pending')
    if (next !== -1) activeIndex.value = next
  }

  function reset(clearOffset = false, languageCode?: string) {
    slots.value = []
    activeIndex.value = 0
    if (clearOffset && languageCode) {
      offset.value = 0
      localStorage.removeItem(offsetKey(languageCode))
    }
    error.value = null
  }

  return {
    slots,
    activeIndex,
    activeSentence,
    allDone,
    recordedCount,
    loading,
    error,
    fetchBatch,
    markRecorded,
    markSkipped,
    setActiveIndex,
    reset,
  }
})
