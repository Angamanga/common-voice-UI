import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'
import { useMockStorageStore } from '@/stores/mockStorage'
import { useUserStore } from '@/stores/user'

export type ListenSlotStatus = 'loading' | 'ready' | 'voted' | 'skipped' | 'error'

export interface ListenSlot {
  audioId: string
  userId: string
  sentence: string | null
  audioUrl: string | null
  status: ListenSlotStatus
  vote: 'yes' | 'no' | null
  error: string | null
}

export const useListenStore = defineStore('listen', () => {
  const slots = ref<ListenSlot[]>([])
  const activeIndex = ref(0)
  const loading = ref(false)

  const activeSlot = computed(() => slots.value[activeIndex.value] ?? null)
  const allDone = computed(() =>
    slots.value.length > 0 &&
    slots.value.every((s) => s.vote !== null || s.status === 'skipped'),
  )

  async function loadBatch() {
    const mockStore = useMockStorageStore()
    const currentUserId = useUserStore().userId
    const entries = mockStore.recordings.filter((e) => e.userId !== currentUserId).slice(0, 5)
    if (entries.length === 0) {
      slots.value = []
      return
    }

    loading.value = true
    slots.value = entries.map((e) => ({
      audioId: e.audioId,
      userId: e.userId,
      sentence: null,
      audioUrl: null,
      status: 'loading' as ListenSlotStatus,
      vote: null,
      error: null,
    }))
    activeIndex.value = 0

    await Promise.all(
      entries.map(async (entry, i) => {
        try {
          const { data } = await api.get(`/audio/${entry.audioId}`)
          console.log(`Loaded audio ${entry.audioId}:`, data)
          slots.value[i] = {
            ...slots.value[i],
            sentence: data.metadata?.sentence ?? null,
            audioUrl: data.url ?? null,
            status: 'ready',
          }
        } catch {
          slots.value[i] = { ...slots.value[i], status: 'error', error: 'Failed to load' }
        }
      }),
    )
    loading.value = false
  }

  function setActiveIndex(index: number) {
    activeIndex.value = index
  }

  function vote(index: number, choice: 'yes' | 'no') {
    if (!slots.value[index]) return
    slots.value[index] = { ...slots.value[index], vote: choice, status: 'voted' }
    const voterId = useUserStore().userId ?? ''
    useMockStorageStore().recordVote(slots.value[index].audioId, voterId, choice)
    const next = slots.value.findIndex(
      (s, i) => i > index && s.vote === null && s.status !== 'skipped',
    )
    if (next !== -1) activeIndex.value = next
  }

  function skip(index: number) {
    if (!slots.value[index]) return
    slots.value[index] = { ...slots.value[index], status: 'skipped' }
    const next = slots.value.findIndex(
      (s, i) => i > index && s.vote === null && s.status !== 'skipped',
    )
    if (next !== -1) activeIndex.value = next
  }

  function reset() {
    slots.value = []
    activeIndex.value = 0
    loading.value = false
  }

  return { slots, activeIndex, activeSlot, allDone, loading, loadBatch, setActiveIndex, vote, skip, reset }
})
