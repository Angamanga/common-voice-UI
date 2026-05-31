<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useListenStore } from '@/stores/listen'

const listenStore = useListenStore()
const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const hasPlayed = ref(false)
const playError = ref<string | null>(null)

const isEmpty = computed(() => !listenStore.loading && listenStore.slots.length === 0)

watch(() => listenStore.activeIndex, async () => {
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.currentTime = 0
  }
  isPlaying.value = false
  hasPlayed.value = false
  playError.value = null
  if (!listenStore.allDone) {
    await nextTick()
    togglePlay()
  }
})

async function togglePlay() {
  const url = listenStore.activeSlot?.audioUrl
  console.log(listenStore.activeSlot)
  if (!audioEl.value || !url) return
  playError.value = null

  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
  } else {
    if (audioEl.value.src !== url) {
      audioEl.value.src = url
      audioEl.value.load()
    }
    hasPlayed.value = true
    try {
      await audioEl.value.play()
      isPlaying.value = true
    } catch (err: unknown) {
      playError.value = err instanceof Error ? err.message : 'Playback failed'
      console.error('[ListenView] play() failed:', err, 'src:', audioEl.value.src)
    }
  }
}

function onAudioEnded() {
  isPlaying.value = false
}

function onVote(choice: 'yes' | 'no') {
  listenStore.vote(listenStore.activeIndex, choice)
}

function onSkip() {
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.currentTime = 0
  }
  isPlaying.value = false
  listenStore.skip(listenStore.activeIndex)
}

onMounted(() => listenStore.loadBatch())
</script>

<template>
  <div class="listen-view">

    <!-- Empty state -->
    <div v-if="isEmpty" class="empty-state">
      <p class="empty-msg">No recordings to review yet.</p>
      <p class="empty-sub">Visit <strong>Speak</strong> to record some clips first.</p>
    </div>

    <div v-else-if="listenStore.allDone" class="empty-state">
      <p class="empty-msg">No more clips available.</p>
      <p class="empty-sub">Check back later for new recordings to review.</p>
    </div>

    <template v-else>
      <!-- Hint -->
      <div class="status-bar">
        <p class="status-text">
          Click
          <span class="hint-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="#4caf50">
              <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>
            </svg>
          </span>
          did they accurately speak the sentence?
        </p>
      </div>

      <!-- Main content row -->
      <div class="content-row">
        <!-- Sentence card -->
        <div class="card-area">
          <div class="sentence-card">
            <div v-if="listenStore.activeSlot?.status === 'loading'" class="skeleton">
              <div class="skeleton-line" />
              <div class="skeleton-line short" />
            </div>
            <p v-else-if="listenStore.activeSlot?.sentence" class="sentence-text">
              {{ listenStore.activeSlot.sentence }}
            </p>
            <p v-else-if="listenStore.activeSlot?.status === 'error'" class="error-text">
              {{ listenStore.activeSlot.error }}
            </p>
            <p v-else class="empty-text">No sentence available</p>
          </div>
        </div>

        <!-- Numbered slots -->
        <div class="slots-panel">
          <div
            v-for="(slot, i) in listenStore.slots"
            :key="i"
            class="slot"
            :class="{
              active: listenStore.activeIndex === i,
              voted: slot.vote !== null,
              skipped: slot.status === 'skipped',
            }"
            @click="listenStore.setActiveIndex(i)"
          >
            <span v-if="listenStore.activeIndex === i" class="slot-speaker">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </span>
            <span class="slot-num">{{ i + 1 }}</span>
          </div>
        </div>
      </div>

      <div v-if="playError" class="error-banner">{{ playError }}</div>

      <!-- Play + Vote buttons -->
      <div class="vote-area">
        <button
          class="vote-btn vote-btn--yes"
          :disabled="!hasPlayed"
          @click="onVote('yes')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
          </svg>
          YES
        </button>

        <button
          class="play-btn"
          :class="{ playing: isPlaying }"
          :disabled="!listenStore.activeSlot?.audioUrl || listenStore.activeSlot?.status === 'loading'"
          @click="togglePlay"
          aria-label="Play audio"
        >
          <div v-if="isPlaying" class="pulse-ring" />
          <div v-if="isPlaying" class="pulse-ring delay" />
          <div class="play-circle">
            <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </div>
        </button>

        <button
          class="vote-btn vote-btn--no"
          :disabled="!hasPlayed"
          @click="onVote('no')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
          </svg>
          NO
        </button>

        <audio ref="audioEl" @ended="onAudioEnded" />
      </div>
    </template>

    <!-- Fixed bottom bar -->
    <div class="action-bar">
      <div class="action-bar-left"></div>
      <button class="skip-btn" :disabled="isEmpty" @click="onSkip">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6l12 6-12 6V6z"/>
        </svg>
        Skip
      </button>
    </div>

  </div>
</template>

<style scoped>
.listen-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 80px);
  background: #f5f5f5;
  padding: 32px 24px 120px;
  gap: 24px;
}

/* ── Empty state ───────────────────────────────────────────────────────────── */
.empty-state {
  margin: auto;
  text-align: center;
}

.empty-msg {
  font-size: 1.1rem;
  color: #444;
  margin: 0 0 8px;
}

.empty-sub {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
}

/* ── Error banner ──────────────────────────────────────────────────────────── */
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

/* ── Hint ──────────────────────────────────────────────────────────────────── */
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

.hint-icon {
  display: flex;
  align-items: center;
}

/* ── Content row ───────────────────────────────────────────────────────────── */
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

.sentence-card {
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.sentence-text {
  font-size: 1.5rem;
  font-weight: 500;
  color: #0f0f0f;
  line-height: 1.5;
  text-align: center;
  margin: 0;
}

.empty-text,
.error-text {
  font-size: 1rem;
  color: #aaa;
  margin: 0;
}

.error-text {
  color: #c62828;
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.skeleton-line {
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.5s infinite;
  width: 100%;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Numbered slots ────────────────────────────────────────────────────────── */
.slots-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

.slot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 44px;
  cursor: pointer;
}

.slot-speaker {
  color: #0095ff;
  display: flex;
  align-items: center;
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
  transition: background 0.15s, color 0.15s;
}

.slot.active .slot-num {
  background: #0f0f0f;
  color: #fff;
}

.slot.voted .slot-num {
  background: #e8f5e9;
  color: #388e3c;
}

.slot.skipped .slot-num {
  background: #f5f5f5;
  color: #bbb;
}

/* ── Vote + Play area ──────────────────────────────────────────────────────── */
.vote-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 8px 0;
}

.vote-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 28px;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #444;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.vote-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.vote-btn--yes:not(:disabled):hover {
  border-color: #4caf50;
  color: #388e3c;
  background: #f1f8e9;
}

.vote-btn--no:not(:disabled):hover {
  border-color: #ef5350;
  color: #c62828;
  background: #fff3f3;
}

/* Play button */
.play-btn {
  position: relative;
  width: 72px;
  height: 72px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.play-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0095ff;
  position: relative;
  z-index: 1;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.play-btn:not(:disabled):hover .play-circle {
  box-shadow: 0 4px 16px rgba(0, 149, 255, 0.25);
  border-color: #0095ff;
}

.play-btn.playing .play-circle {
  border-color: #0095ff;
  box-shadow: 0 0 0 4px rgba(0, 149, 255, 0.15);
}

.pulse-ring {
  position: absolute;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid rgba(0, 149, 255, 0.4);
  animation: pulse-out 1.8s ease-out infinite;
}

.pulse-ring.delay {
  animation-delay: 0.6s;
}

@keyframes pulse-out {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ── Bottom action bar ─────────────────────────────────────────────────────── */
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.bar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
  padding: 8px 14px;
  border-radius: 20px;
  transition: background 0.15s, border-color 0.15s;
}

.bar-btn:hover {
  background: #e8e8e8;
  border-color: #bbb;
}

.bar-btn--icon {
  padding: 8px 10px;
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

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .listen-view {
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

  .sentence-card {
    padding: 24px 20px;
    min-height: 120px;
  }

  .sentence-text {
    font-size: 1.2rem;
  }

  .slots-panel {
    flex-direction: row;
    justify-content: center;
  }

  .slot {
    height: auto;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .vote-area {
    gap: 16px;
  }

  .vote-btn {
    padding: 10px 16px;
    font-size: 0.85rem;
  }

  .action-bar {
    padding: 12px 16px;
  }
}
</style>
