<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useSentenceStore } from '@/stores/sentence'
import { useRecordingStore } from '@/stores/recording'
import { useUserStore } from '@/stores/user'
import { useDatasetStore } from '@/stores/dataset'
import SentenceCard from '@/components/SentenceCard.vue'
import RecordingSlots from '@/components/RecordingSlots.vue'
import MicButton from '@/components/MicButton.vue'
import SuccessToast from '@/components/SuccessToast.vue'

const sentenceStore = useSentenceStore()
const recordingStore = useRecordingStore()
const userStore = useUserStore()
const datasetStore = useDatasetStore()

const showToast = ref(false)
const toastMessage = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)
const micError = ref<string | null>(null)

// ── Status text ──────────────────────────────────────────────────────────────
const statusText = computed(() => {
  if (recordingStore.isRecording) return 'Recording… speak clearly'
  const recordedCount = sentenceStore.recordedCount
  if (recordedCount === 0) return 'Click 🎤 and read the sentence aloud'
  if (recordedCount === sentenceStore.slots.length) return 'All done! Submit your clips below'
  return 'Good job, record again!'
})

// ── Readiness ────────────────────────────────────────────────────────────────
const canSubmit = computed(() =>
  sentenceStore.recordedCount > 0 &&
  sentenceStore.recordedCount === sentenceStore.slots.filter((s) => s.status !== 'skipped').length &&
  !submitting.value,
)

// ── Mic button handler ───────────────────────────────────────────────────────
async function onMicClick() {
  micError.value = null
  const idx = sentenceStore.activeIndex
  try {
    if (recordingStore.isRecording) {
      await recordingStore.stopRecording()
      sentenceStore.markRecorded(idx)
    } else {
      await recordingStore.startRecording(idx)
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      micError.value = 'Microphone access denied. Please allow microphone access in your browser.'
    } else {
      micError.value = err instanceof Error ? err.message : 'Could not start recording'
    }
  }
}

// ── Slot actions ─────────────────────────────────────────────────────────────
async function onStartRecording(index: number) {
  micError.value = null
  sentenceStore.setActiveIndex(index)
  try {
    await recordingStore.startRecording(index)
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      micError.value = 'Microphone access denied.'
    } else {
      micError.value = err instanceof Error ? err.message : 'Could not start recording'
    }
  }
}

async function onReRecord(index: number) {
  sentenceStore.slots[index].status = 'pending'
  sentenceStore.setActiveIndex(index)
}

// ── Skip ─────────────────────────────────────────────────────────────────────
async function onSkip() {
  if (recordingStore.isRecording) await recordingStore.stopRecording()
  const idx = sentenceStore.activeIndex
  recordingStore.resetSlot(idx)
  await sentenceStore.skipAndReplace(idx, datasetStore.selectedCode)
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function onSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  submitError.value = null
  try {
    await recordingStore.uploadAll(sentenceStore.slots, {
      datasetCode: datasetStore.selectedCode,
      userId: userStore.userId ?? '',
      ...userStore.getDemographics(),
    })
    // Persist the IDs of successfully uploaded sentences so they are skipped in future sessions
    const uploadedIds = sentenceStore.slots
      .filter((s) => s.status === 'recorded')
      .map((s) => s.sentence.id)
    sentenceStore.persistRecordedIds(datasetStore.selectedCode, uploadedIds)
    toastMessage.value = '🎉 Clips uploaded successfully!'
    showToast.value = true
    // Load next batch
    setTimeout(async () => {
      recordingStore.reset()
      sentenceStore.reset()
      await sentenceStore.fetchBatch(datasetStore.selectedCode)
    }, 1500)
  } catch {
    submitError.value = 'Upload failed. Check your connection and try again.'
  } finally {
    submitting.value = false
  }
}

// ── Auto-stop when recording reaches max duration ────────────────────────────
watch(
  () => recordingStore.slots[sentenceStore.activeIndex]?.status,
  (status) => {
    if (status === 'recorded') {
      sentenceStore.markRecorded(sentenceStore.activeIndex)
    }
  },
)

onUnmounted(() => {
  if (recordingStore.isRecording) recordingStore.stopRecording()
})
</script>

<template>
  <div class="speak-view">
    <!-- Status text -->
    <div class="status-bar">
      <p class="status-text">
        {{ statusText }}
        <span v-if="!recordingStore.isRecording" class="mic-hint">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#ff4f5e">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/>
          </svg>
        </span>
      </p>
    </div>

    <div v-if="micError" class="error-banner">{{ micError }}</div>
    <div v-if="submitError" class="error-banner">{{ submitError }}</div>

    <!-- Main content row -->
    <div class="content-row">
      <!-- Sentence card (center) -->
      <div class="card-area">
        <SentenceCard
          :sentence="sentenceStore.activeSentence"
          :loading="sentenceStore.loading"
        />
      </div>

      <!-- Recording slots (right) -->
      <RecordingSlots
        @start-recording="onStartRecording"
        @re-record="onReRecord"
      />
    </div>

    <!-- Mic button -->
    <div class="mic-area">
      <MicButton
        :is-recording="recordingStore.isRecording"
        :disabled="sentenceStore.loading || sentenceStore.slots.length === 0"
        @click="onMicClick"
      />
    </div>

    <!-- Bottom action bar -->
    <div class="action-bar">
      <div class="action-bar-left" />

      <div class="action-bar-right">
        <button class="skip-btn" :disabled="sentenceStore.loading || submitting" @click="onSkip">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6l12 6-12 6V6z"/>
          </svg>
          Skip
        </button>

        <button
          class="submit-btn"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          <span v-if="submitting" class="spinner" />
          <span v-else>Submit</span>
        </button>
      </div>
    </div>

    <SuccessToast
      v-if="showToast"
      :message="toastMessage"
      @close="showToast = false"
    />
  </div>
</template>

<style scoped>
.speak-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 56px);
  background: #f5f5f5;
  padding: 32px 24px 120px;
  gap: 24px;
}

.status-bar {
  text-align: center;
}

.status-text {
  font-size: 0.95rem;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin: 0;
}

.mic-hint {
  display: flex;
  align-items: center;
}

.error-banner {
  background: #fff3f3;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  max-width: 760px;
  width: 100%;
  text-align: center;
}

.content-row {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  width: 100%;
  max-width: 920px;
  justify-content: center;
}

.card-area {
  flex: 1;
  max-width: 640px;
}

.mic-area {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 40px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}

.action-bar-left {
  flex: 1;
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.skip-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #444;
  padding: 10px 16px;
  border-radius: 24px;
  transition: background 0.15s;
}

.skip-btn:hover:not(:disabled) {
  background: #e8e8e8;
}

.skip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.submit-btn {
  padding: 12px 28px;
  background: #ccc;
  color: #888;
  border: none;
  border-radius: 24px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: not-allowed;
  transition: background 0.2s, color 0.2s;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:not(:disabled) {
  background: #0f0f0f;
  color: #fff;
  cursor: pointer;
}

.submit-btn:not(:disabled):hover {
  background: #333;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .speak-view {
    padding: 16px 16px 100px;
    gap: 16px;
    min-height: calc(100vh - 48px);
  }
  .content-row {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  .card-area {
    max-width: 100%;
  }
  .action-bar {
    padding: 12px 16px;
  }
  .action-bar-right {
    gap: 8px;
  }
  .submit-btn {
    padding: 10px 20px;
    min-width: 100px;
    font-size: 0.85rem;
  }
  .skip-btn {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
}
</style>
