<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppNavBar from '@/components/AppNavBar.vue'
import LoginModal from '@/components/LoginModal.vue'
import SetupModal from '@/components/SetupModal.vue'
import CookieBanner from '@/components/CookieBanner.vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useSentenceStore } from '@/stores/sentence'
import { useDatasetStore } from '@/stores/dataset'

const CONSENT_KEY = 'cv_cookie_consent'

const authStore = useAuthStore()
const userStore = useUserStore()
const sentenceStore = useSentenceStore()
const datasetStore = useDatasetStore()

const initError = ref<string | null>(null)
const needsLogin = ref(!userStore.userId)
const showSetup = ref(false)
const showCookieBanner = ref(localStorage.getItem(CONSENT_KEY) === null)
const consentDeclined = ref(localStorage.getItem(CONSENT_KEY) === 'declined')

onMounted(async () => {
  try {
    await authStore.fetchToken()
    // If userId already in localStorage, skip login and load sentences immediately
    if (userStore.userId) {
      await sentenceStore.fetchBatch(datasetStore.selectedCode)
    }
  } catch (err: unknown) {
    initError.value = err instanceof Error ? err.message : 'Could not initialise. Check your API credentials.'
  }
})

async function onLoginDone() {
  needsLogin.value = false
  try {
    await sentenceStore.fetchBatch(datasetStore.selectedCode)
  } catch (err: unknown) {
    initError.value = err instanceof Error ? err.message : 'Could not load sentences.'
  }
}

function onNeedsSetup() {
  needsLogin.value = false
  showSetup.value = true
}

async function onSetupDone() {
  showSetup.value = false
  try {
    await sentenceStore.fetchBatch(datasetStore.selectedCode)
  } catch (err: unknown) {
    initError.value = err instanceof Error ? err.message : 'Could not load sentences.'
  }
}

function onCookieAccept() {
  showCookieBanner.value = false
  needsLogin.value = !userStore.userId
}

function onCookieDecline() {
  showCookieBanner.value = false
  consentDeclined.value = true
}

function onLogout() {
  userStore.logout()
  sentenceStore.reset(true, datasetStore.selectedCode)
  needsLogin.value = true
}

async function onLanguageChange(code: string) {
  sentenceStore.reset()
  try {
    await sentenceStore.fetchBatch(code)
  } catch (err: unknown) {
    initError.value = err instanceof Error ? err.message : 'Could not load sentences.'
  }
}
</script>

<template>
  <div id="app-root">
    <AppNavBar @logout="onLogout" @language-change="onLanguageChange" />

    <main>
      <div v-if="consentDeclined" class="init-error">
        You declined storage consent. The app cannot function without saving your session locally.
        <br /><br />
        <button class="reopen-consent" @click="showCookieBanner = true; consentDeclined = false">Review consent</button>
      </div>
      <div v-else-if="initError" class="init-error">
        {{ initError }}
      </div>
      <router-view v-else />
    </main>

    <LoginModal v-if="needsLogin && !showCookieBanner && !consentDeclined" @done="onLoginDone" @needs-setup="onNeedsSetup" />
    <SetupModal v-if="showSetup" @done="onSetupDone" />
    <CookieBanner v-if="showCookieBanner" @accept="onCookieAccept" @decline="onCookieDecline" />
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #0f0f0f;
}

#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.init-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #c62828;
  font-size: 1rem;
  padding: 24px;
  text-align: center;
}

.reopen-consent {
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

.reopen-consent:hover {
  background: #333;
}
</style>
