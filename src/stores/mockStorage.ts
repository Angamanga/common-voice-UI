import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface MockVote {
  voterId: string
  vote: 'yes' | 'no'
}

export interface MockRecordingEntry {
  audioId: string
  userId: string
  votes: MockVote[]
}

export const useMockStorageStore = defineStore('mockStorage', () => {
  const recordings = ref<MockRecordingEntry[]>([])

  function addRecording(audioId: string, userId: string) {
    if (!import.meta.env.DEV) return
    recordings.value.push({ audioId, userId, votes: [] })
    console.log(`Added recording: audioId=${audioId}, userId=${userId}`)
  }

  function recordVote(audioId: string, voterId: string, vote: 'yes' | 'no') {
    if (!import.meta.env.DEV) return
    const entry = recordings.value.find((e) => e.audioId === audioId)
    if (entry) entry.votes.push({ voterId, vote })
      console.log(`Recorded vote: audioId=${audioId}, voterId=${voterId}, vote=${vote}`)
  }

  return { recordings, addRecording, recordVote }
})
