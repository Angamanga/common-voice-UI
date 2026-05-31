import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'
import type { SentenceSlot } from '@/stores/sentence'
import { useMockStorageStore } from '@/stores/mockStorage'

export type RecordingStatus = 'idle' | 'recording' | 'recorded' | 'uploading' | 'uploaded' | 'error'

export interface SlotRecording {
  blob: Blob | null
  objectUrl: string | null
  status: RecordingStatus
  uploadId: string | null
  error: string | null
}

const MAX_DURATION_MS = 15_000
const SLOT_COUNT = 5

function emptySlot(): SlotRecording {
  return { blob: null, objectUrl: null, status: 'idle', uploadId: null, error: null }
}

function preferredMimeType(): string {
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export const useRecordingStore = defineStore('recording', () => {
  const slots = ref<SlotRecording[]>(Array.from({ length: SLOT_COUNT }, emptySlot))
  const activeSlot = ref(0)
  const isRecording = ref(false)

  let mediaRecorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let stopTimer: ReturnType<typeof setTimeout> | null = null
  let chunks: BlobPart[] = []

  const allUploaded = computed(() => slots.value.every((s) => s.status === 'uploaded'))

  async function startRecording(slotIndex: number) {
    if (isRecording.value) await stopRecording()

    activeSlot.value = slotIndex
    chunks = []

    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = preferredMimeType()
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    mediaRecorder.onstop = () => {
      const mimeUsed = mediaRecorder?.mimeType ?? 'audio/webm'
      const blob = new Blob(chunks, { type: mimeUsed })
      const prev = slots.value[slotIndex].objectUrl
      if (prev) URL.revokeObjectURL(prev)
      slots.value[slotIndex] = {
        blob,
        objectUrl: URL.createObjectURL(blob),
        status: 'recorded',
        uploadId: null,
        error: null,
      }
      isRecording.value = false
      releaseStream()
    }

    mediaRecorder.start()
    isRecording.value = true
    slots.value[slotIndex] = { ...slots.value[slotIndex], status: 'recording' }

    stopTimer = setTimeout(() => stopRecording(), MAX_DURATION_MS)
  }

  function stopRecording(): Promise<void> {
    return new Promise((resolve) => {
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null }
      if (!mediaRecorder || mediaRecorder.state === 'inactive') { resolve(); return }
      mediaRecorder.addEventListener('stop', () => resolve(), { once: true })
      mediaRecorder.stop()
    })
  }

  function releaseStream() {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    mediaRecorder = null
  }

  function resetSlot(index: number) {
    const prev = slots.value[index].objectUrl
    if (prev) URL.revokeObjectURL(prev)
    slots.value[index] = emptySlot()
  }

  async function uploadAll(
    sentenceSlots: SentenceSlot[],
    opts: {
      datasetCode: string
      userId: string
      age?: string | null
      gender?: string | null
      variantCode?: string | null
      accentCode?: string | null
    },
  ) {
    const uploads = slots.value.map(async (slot, i) => {
      if (slot.status !== 'recorded' || !slot.blob) return
      if (sentenceSlots[i]?.status !== 'recorded') return

      slots.value[i] = { ...slots.value[i], status: 'uploading' }
      const { sentence } = sentenceSlots[i]

      const form = new FormData()
      const ext = slot.blob.type.includes('ogg') ? 'ogg' : 'webm'
      form.append('file', slot.blob, `clip-${i}.${ext}`)
      form.append('resource', 'scripted')
      form.append('datasetCode', opts.datasetCode)
      form.append('textId', sentence.id)
      form.append('text', sentence.text)
      form.append('hash', sentence.hash)
      form.append('userId', opts.userId)
      if (opts.age) form.append('age', opts.age)
      if (opts.gender) form.append('gender', opts.gender)
      if (opts.variantCode) form.append('variantCode', opts.variantCode)
      if (opts.accentCode) form.append('accentCode', opts.accentCode)

      try {
        const { data } = await api.post('/audio', form)
        console.log(`Uploaded slot ${i}:`, data)
        slots.value[i] = { ...slots.value[i], status: 'uploaded', uploadId: data.id }
        useMockStorageStore().addRecording(data.id, opts.userId)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        slots.value[i] = { ...slots.value[i], status: 'error', error: msg }
        throw err
      }
    })

    await Promise.all(uploads)
  }

  function reset() {
    slots.value.forEach((_, i) => resetSlot(i))
    activeSlot.value = 0
    isRecording.value = false
  }

  return {
    slots,
    activeSlot,
    isRecording,
    allUploaded,
    startRecording,
    stopRecording,
    resetSlot,
    uploadAll,
    reset,
  }
})
