<script setup lang="ts">
import { ref } from 'vue'

const CONSENT_KEY = 'cv_cookie_consent'

const emit = defineEmits<{
  accept: []
  decline: []
}>()

const expanded = ref(false)

function accept() {
  localStorage.setItem(CONSENT_KEY, 'accepted')
  emit('accept')
}

function decline() {
  // Clear all app storage so no personal data is retained
  Object.keys(localStorage)
    .filter((k) => k.startsWith('cv_'))
    .forEach((k) => localStorage.removeItem(k))
  localStorage.setItem(CONSENT_KEY, 'declined')
  emit('decline')
}
</script>

<template>
  <Transition name="banner">
    <div class="banner" role="dialog" aria-label="Cookie consent">
      <div class="banner-inner">
        <div class="banner-text">
          <p class="banner-lead">
            This site stores data in your browser (localStorage) to remember your session, language
            preference, and recording progress.
          </p>
          <p v-if="expanded" class="banner-detail">
            Specifically, we store: your user identifier, selected language, sentence offset, and
            IDs of sentences you have already recorded. No tracking or advertising cookies are used.
            Declining will clear this data and prevent the app from saving your progress.
          </p>
          <button class="learn-more" @click="expanded = !expanded">
            {{ expanded ? 'Show less' : 'Learn more' }}
          </button>
        </div>

        <div class="banner-actions">
          <button class="btn-decline" @click="decline">Decline</button>
          <button class="btn-accept" @click="accept">Accept</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 500;
  padding: 16px 24px;
}

.banner-inner {
  max-width: 920px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
}

.banner-text {
  flex: 1;
}

.banner-lead {
  margin: 0 0 4px;
  font-size: 0.875rem;
  color: #333;
  line-height: 1.5;
}

.banner-detail {
  margin: 8px 0 4px;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.5;
}

.learn-more {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8rem;
  color: #0095ff;
  cursor: pointer;
  text-decoration: underline;
}

.learn-more:hover {
  color: #0077cc;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-accept {
  padding: 10px 24px;
  background: #0f0f0f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-accept:hover {
  background: #333;
}

.btn-decline {
  padding: 10px 16px;
  background: none;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.btn-decline:hover {
  background: #f5f5f5;
  border-color: #aaa;
}

.banner-enter-active,
.banner-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .banner-inner {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .banner-actions {
    justify-content: flex-end;
  }
}
</style>
