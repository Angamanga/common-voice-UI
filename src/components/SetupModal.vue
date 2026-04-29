<script setup lang="ts">
import { ref } from 'vue'
import QRCode from 'qrcode'
import { useDatasetStore } from '@/stores/dataset'
import { useUserStore } from '@/stores/user'

const emit = defineEmits<{ done: [] }>()

const datasetStore = useDatasetStore()
const userStore = useUserStore()

const step = ref<'form' | 'recovery'>('form')
const selectedCode = ref(datasetStore.selectedCode)
const selectedAge = ref(userStore.age ?? '')
const selectedGender = ref(userStore.gender ?? '')
const selectedVariant = ref(userStore.variantCode ?? '')
const selectedAccent = ref(userStore.accentCode ?? '')
const loading = ref(false)
const error = ref<string | null>(null)
const copied = ref(false)
const qrDataUrl = ref<string | null>(null)

const AGE_RANGES = ['', 'teens', 'twenties', 'thirties', 'forties', 'fifties', 'sixties', 'seventies', 'eighties', 'nineties']
const GENDERS = ['', 'male', 'female', 'other', 'prefer not to say']

async function submit() {
  loading.value = true
  error.value = null
  try {
    datasetStore.selectedCode = selectedCode.value
    userStore.setDemographics({
      age: selectedAge.value || undefined,
      gender: selectedGender.value || undefined,
      variantCode: selectedVariant.value || undefined,
      accentCode: selectedAccent.value || undefined,
    })
    if (userStore.userId) {
      qrDataUrl.value = await QRCode.toDataURL(userStore.userId, { width: 200, margin: 1 })
    }
    step.value = 'recovery'
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Setup failed'
  } finally {
    loading.value = false
  }
}

async function copyCode() {
  if (!userStore.userId) return
  await navigator.clipboard.writeText(userStore.userId)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="overlay">
    <div class="modal">

      <!-- Step 1: demographics -->
      <template v-if="step === 'form'">
        <h2 class="modal-title">Welcome to Common Voice</h2>
        <p class="modal-subtitle">Choose a language and optionally share demographic info to improve voice data quality.</p>

        <div v-if="error" class="error-banner">{{ error }}</div>

        <div class="field">
          <label>Language / Dataset</label>
          <select v-model="selectedCode">
            <option
              v-for="lang in datasetStore.languages"
              :key="lang.code"
              :value="lang.code"
            >
              {{ lang.name }} ({{ lang.code }})
            </option>
          </select>
        </div>

        <div class="field">
          <label>Age <span class="optional">optional</span></label>
          <select v-model="selectedAge">
            <option value="">Prefer not to say</option>
            <option v-for="a in AGE_RANGES.slice(1)" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <div class="field">
          <label>Gender <span class="optional">optional</span></label>
          <select v-model="selectedGender">
            <option value="">Prefer not to say</option>
            <option v-for="g in GENDERS.slice(1)" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <button class="submit-btn" :disabled="loading || !selectedCode" @click="submit">
          <span v-if="loading">Setting up…</span>
          <span v-else>Get Started</span>
        </button>
      </template>

      <!-- Step 2: recovery code -->
      <template v-else>
        <h2 class="modal-title">Your recovery code</h2>
        <p class="modal-subtitle">
          Save this code somewhere safe. You will need it to request deletion of your recordings under your privacy rights.
        </p>

        <div class="qr-wrap">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="Recovery code QR" width="200" height="200" />
        </div>

        <div class="recovery-code">{{ userStore.userId }}</div>

        <button class="copy-btn" @click="copyCode">
          {{ copied ? 'Copied!' : 'Copy code' }}
        </button>

        <button class="submit-btn" @click="emit('done')">Continue</button>
      </template>

    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f0f0f;
  margin: 0 0 8px;
}

.modal-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 28px;
  line-height: 1.5;
}

.error-banner {
  background: #fff3f3;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.optional {
  font-weight: 400;
  color: #aaa;
  font-size: 0.8rem;
}

.field select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  color: #0f0f0f;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}

.field select:focus {
  outline: none;
  border-color: #0095ff;
  box-shadow: 0 0 0 3px rgba(0,149,255,0.15);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #0f0f0f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;
}

.submit-btn:hover:not(:disabled) {
  background: #333;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qr-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.recovery-code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 14px 16px;
  word-break: break-all;
  color: #0f0f0f;
  margin-bottom: 12px;
  text-align: center;
}

.copy-btn {
  width: 100%;
  padding: 11px;
  background: #fff;
  color: #0f0f0f;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
  transition: background 0.15s;
}

.copy-btn:hover {
  background: #f5f5f5;
}

@media (max-width: 640px) {
  .modal {
    padding: 28px 20px;
    margin: 0 16px;
    border-radius: 12px;
    max-height: 90vh;
    overflow-y: auto;
  }
}
</style>
