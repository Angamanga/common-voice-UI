<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue'
import { useSentenceStore } from '@/stores/sentence'
import { useRecordingStore } from '@/stores/recording'

const sentenceStore = useSentenceStore()
const recordingStore = useRecordingStore()

const emit = defineEmits<{
  startRecording: [index: number]
  reRecord: [index: number]
}>()

const audioRefs = ref<(HTMLAudioElement | null)[]>([])

function setAudioRef(el: Element | ComponentPublicInstance | null, index: number) {
  audioRefs.value[index] = el as HTMLAudioElement | null
}

function playSlot(index: number) {
  audioRefs.value[index]?.play()
}

function onStartClick(index: number) {
  emit('startRecording', index)
}

function onReRecord(index: number) {
  recordingStore.resetSlot(index)
  sentenceStore.setActiveIndex(index)
  emit('reRecord', index)
}

const slots = computed(() =>
  sentenceStore.slots.map((s, i) => ({
    sentenceSlot: s,
    recording: recordingStore.slots[i],
    index: i,
    isActive: sentenceStore.activeIndex === i,
  })),
)
</script>

<template>
  <div class="slots-panel">
    <div
      v-for="slot in slots"
      :key="slot.index"
      class="slot"
      :class="{
        active: slot.isActive,
        recorded: slot.recording.status === 'recorded' || slot.recording.status === 'uploaded',
        recording: slot.recording.status === 'recording',
      }"
    >
      <template v-if="slot.recording.status === 'recorded' || slot.recording.status === 'uploaded'">
        <audio
          v-if="slot.recording.objectUrl"
          :src="slot.recording.objectUrl"
          :ref="(el) => setAudioRef(el, slot.index)"
          class="hidden-audio"
        />
        <button
          class="icon-btn"
          title="Play"
          @click="playSlot(slot.index)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>
          </svg>
        </button>
        <button class="icon-btn" title="Re-record" @click="onReRecord(slot.index)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.5 2.5A6.5 6.5 0 1 0 14.9 8h-1.5A5 5 0 1 1 12 4.2L10 6h4V2l-1.5 1.5 1 -1z"/>
          </svg>
        </button>
        <span class="slot-num">{{ slot.index + 1 }}</span>
      </template>

      <template v-else-if="slot.isActive && slot.recording.status !== 'recording'">
        <button class="start-btn" @click="onStartClick(slot.index)">
          START RECORDING
        </button>
        <span class="slot-num active-num">{{ slot.index + 1 }}</span>
      </template>

      <template v-else-if="slot.recording.status === 'recording'">
        <span class="recording-indicator">
          <span class="rec-dot" />
          REC
        </span>
        <span class="slot-num">{{ slot.index + 1 }}</span>
      </template>

      <template v-else>
        <span class="slot-num idle-num">{{ slot.index + 1 }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.slots-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 200px;
  flex-shrink: 0;
}

.slot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  height: 44px;
}

.slot-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8e8e8;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}

.active-num {
  background: #0f0f0f;
  color: #fff;
}

.start-btn {
  background: transparent;
  border: 2px solid #0f0f0f;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #0f0f0f;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.start-btn:hover {
  background: #0f0f0f;
  color: #fff;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #ccc;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: #f0f0f0;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ff4f5e;
  letter-spacing: 0.05em;
}

.rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4f5e;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.hidden-audio {
  display: none;
}

@media (max-width: 640px) {
  .slots-panel {
    flex-direction: row;
    width: 100%;
    justify-content: center;
    gap: 8px;
  }
  .slot {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: auto;
    min-height: 72px;
    flex: 1;
    gap: 6px;
  }
  .start-btn {
    font-size: 0.55rem;
    padding: 5px 8px;
    white-space: normal;
    text-align: center;
    line-height: 1.3;
  }
}
</style>
