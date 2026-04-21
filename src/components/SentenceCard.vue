<script setup lang="ts">
import type { Sentence } from '@/types/api'

defineProps<{
  sentence: Sentence | null
  loading: boolean
}>()
</script>

<template>
  <div class="card-wrapper">
    <div v-if="loading" class="sentence-card skeleton">
      <div class="skeleton-line" />
      <div class="skeleton-line short" />
    </div>
    <div v-else-if="sentence" class="sentence-card">
      <p class="sentence-text">{{ sentence.text }}</p>
    </div>
    <div v-else class="sentence-card empty">
      <p>No sentence loaded</p>
    </div>
  </div>
</template>

<style scoped>
.card-wrapper {
  width: 100%;
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
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.sentence-text {
  font-size: 1.5rem;
  font-weight: 500;
  color: #0f0f0f;
  line-height: 1.5;
  text-align: center;
  margin: 0;
}

.empty p {
  color: #aaa;
  font-size: 1rem;
  margin: 0;
}

.skeleton {
  flex-direction: column;
  gap: 16px;
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

@media (max-width: 640px) {
  .sentence-card {
    padding: 24px 20px;
    min-height: 120px;
  }
  .sentence-text {
    font-size: 1.2rem;
  }
}
</style>
