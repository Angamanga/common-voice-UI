<script setup lang="ts">
defineProps<{
  isRecording: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="mic-btn"
    :class="{ recording: isRecording, disabled }"
    :disabled="disabled"
    :aria-label="isRecording ? 'Stop recording' : 'Start recording'"
    @click="emit('click')"
  >
    <div class="pulse-ring" v-if="isRecording" />
    <div class="pulse-ring delay" v-if="isRecording" />
    <div class="mic-circle">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/>
      </svg>
    </div>
  </button>
</template>

<style scoped>
.mic-btn {
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

.mic-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mic-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff4f5e;
  position: relative;
  z-index: 1;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.mic-btn:not(.disabled):hover .mic-circle {
  box-shadow: 0 4px 16px rgba(255, 79, 94, 0.25);
  border-color: #ff4f5e;
}

.mic-btn.recording .mic-circle {
  background: #fff;
  border-color: #ff4f5e;
  box-shadow: 0 0 0 4px rgba(255, 79, 94, 0.15);
}

.pulse-ring {
  position: absolute;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid rgba(255, 79, 94, 0.4);
  animation: pulse-out 1.8s ease-out infinite;
}

.pulse-ring.delay {
  animation-delay: 0.6s;
}

@keyframes pulse-out {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
</style>
