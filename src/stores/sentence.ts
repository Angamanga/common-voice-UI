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

function recordedIdsKey(languageCode: string) {
  return `cv_recorded_ids_${languageCode}`
}

function loadRecordedIds(languageCode: string): Set<string> {
  try {
    const raw = localStorage.getItem(recordedIdsKey(languageCode))
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function persistRecordedIdsToStorage(languageCode: string, ids: string[]) {
  const existing = loadRecordedIds(languageCode)
  ids.forEach((id) => existing.add(id))
  localStorage.setItem(recordedIdsKey(languageCode), JSON.stringify([...existing]))
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

  async function fetchBatch(languageCode: string, _retryCount = 0) {
    loading.value = true
    error.value = null
    offset.value = parseInt(localStorage.getItem(offsetKey(languageCode)) ?? '0', 10)
    try {
      const { data } = await api.get('/text/sentences', {
        params: { languageCode, limit: 5, offset: offset.value },
      })
      console.log(`[sentences] ${languageCode} offset=${offset.value}`, data)
      const sentences: Sentence[] = data.data ?? data.sentences ?? data
      offset.value += 5
      localStorage.setItem(offsetKey(languageCode), String(offset.value))

      const recordedIds = loadRecordedIds(languageCode)
      const fresh = sentences.filter((s) => !recordedIds.has(s.id))

      // All sentences in this batch already recorded — try the next batch (max 5 retries)
      if (fresh.length === 0 && sentences.length > 0 && _retryCount < 5) {
        loading.value = false
        return fetchBatch(languageCode, _retryCount + 1)
      }

      slots.value = fresh.map((s) => ({ sentence: s, status: 'pending' }))
      activeIndex.value = 0
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

  async function skipAndReplace(index: number, languageCode: string) {
    if (!slots.value[index]) return
    slots.value[index].status = 'pending'
    loading.value = true
    try {
      const recordedIds = loadRecordedIds(languageCode)
      let replacement: Sentence | null = null
      let attempts = 0
      while (!replacement && attempts < 5) {
        const { data } = await api.get('/text/sentences', {
          params: { languageCode, limit: 1, offset: offset.value },
        })
        const sentences: Sentence[] = data.data ?? data.sentences ?? data
        offset.value += 1
        localStorage.setItem(offsetKey(languageCode), String(offset.value))
        const fresh = sentences.filter((s) => !recordedIds.has(s.id))
        if (fresh.length > 0) replacement = fresh[0]
        attempts++
      }
      if (replacement) {
        slots.value[index] = { sentence: replacement, status: 'pending' }
      }
    } catch {
      error.value = 'Could not load a new sentence'
    } finally {
      loading.value = false
    }
  }

  function setActiveIndex(index: number) {
    activeIndex.value = index
  }

  function advanceActive(fromIndex: number) {
    let next = slots.value.findIndex((s, i) => i > fromIndex && s.status === 'pending')
    if (next === -1) next = slots.value.findIndex((s, i) => i < fromIndex && s.status === 'pending')
    if (next !== -1) activeIndex.value = next
  }

  function persistRecordedIds(languageCode: string, ids: string[]) {
    persistRecordedIdsToStorage(languageCode, ids)
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
    skipAndReplace,
    setActiveIndex,
    persistRecordedIds,
    reset,
  }
})
