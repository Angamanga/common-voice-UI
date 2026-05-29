<script setup lang="ts">
import { ref, computed } from 'vue'
import QRCode from 'qrcode'
import { useDatasetStore } from '@/stores/dataset'
import { useUserStore } from '@/stores/user'

const props = defineProps<{ mode?: 'setup' | 'edit' }>()
const emit = defineEmits<{ done: [] }>()

const datasetStore = useDatasetStore()
const userStore = useUserStore()

const step = ref<'form' | 'recovery'>('form')
const selectedEmail = ref(userStore.email ?? '')
const selectedCodes = ref<string[]>([...datasetStore.selectedCodes])
const showAddLang = ref(false)
const langToAdd = ref('')
const selectedAge = ref(userStore.age ?? '')
const selectedGender = ref(userStore.gender ?? '')
const selectedAccents = ref<Record<string, string>>({ ...userStore.accentCodes })
const loading = ref(false)
const error = ref<string | null>(null)
const copied = ref(false)
const qrDataUrl = ref<string | null>(null)

const AGE_RANGES = ['', 'teens', 'twenties', 'thirties', 'forties', 'fifties', 'sixties', 'seventies', 'eighties', 'nineties']
const GENDERS = ['', 'male', 'female', 'other', 'prefer not to say']

const availableToAdd = computed(() =>
  datasetStore.languages.filter((l) => !selectedCodes.value.includes(l.code))
)

function langName(code: string): string {
  return datasetStore.languages.find((l) => l.code === code)?.name ?? code
}

function langAccents(code: string) {
  return datasetStore.languages.find((l) => l.code === code)?.predefined_accents ?? []
}

function onLangToAddChange() {
  if (!langToAdd.value) return
  selectedCodes.value = [...selectedCodes.value, langToAdd.value]
  langToAdd.value = ''
  showAddLang.value = false
}

function removeLanguage(code: string) {
  if (selectedCodes.value.length <= 1) return
  selectedCodes.value = selectedCodes.value.filter((c) => c !== code)
}

async function submit() {
  loading.value = true
  error.value = null
  try {
    datasetStore.selectLanguages(selectedCodes.value)
    userStore.setDemographics({
      email: selectedEmail.value || undefined,
      age: selectedAge.value || undefined,
      gender: selectedGender.value || undefined,
      accentCodes: selectedAccents.value,
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
          <label>Email address</label>
          <input
            v-model="selectedEmail"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>

        <div class="field">
          <label>Languages</label>

          <div class="lang-list">
            <div v-for="code in selectedCodes" :key="code" class="lang-card">
              <div class="lang-card-header">
                <span class="lang-row-name">{{ langName(code) }} <small>({{ code }})</small></span>
                <button
                  v-if="selectedCodes.length > 1"
                  class="lang-remove-btn"
                  type="button"
                  aria-label="Remove language"
                  @click="removeLanguage(code)"
                >✕</button>
              </div>
              <div v-if="langAccents(code).length > 0" class="lang-accent-row">
                <label class="accent-label">Accent <span class="optional">optional</span></label>
                <select v-model="selectedAccents[code]">
                  <option value="">Prefer not to say</option>
                  <option v-for="a in langAccents(code)" :key="a.code" :value="a.code">
                    {{ a.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="showAddLang" class="add-lang-row">
            <select v-model="langToAdd" :disabled="datasetStore.loading" @change="onLangToAddChange">
              <option value="" disabled>Select a language…</option>
              <option v-for="lang in availableToAdd" :key="lang.code" :value="lang.code">
                {{ lang.name }} ({{ lang.code }})
              </option>
            </select>
            <button class="cancel-add-btn" type="button" @click="showAddLang = false">Cancel</button>
          </div>
          <button
            v-else
            class="add-lang-btn"
            type="button"
            :disabled="availableToAdd.length === 0 || datasetStore.loading"
            @click="showAddLang = true"
          >
            Add language +
          </button>
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

        <button class="submit-btn" :disabled="loading || selectedCodes.length === 0" @click="submit">
          <span v-if="loading">{{ props.mode === 'edit' ? 'Saving…' : 'Setting up…' }}</span>
          <span v-else>{{ props.mode === 'edit' ? 'Save' : 'Get Started' }}</span>
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

.field input[type="email"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f0f0f;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.field input[type="email"]:focus {
  border-color: #0095ff;
  box-shadow: 0 0 0 3px rgba(0,149,255,0.15);
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

.lang-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.lang-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  overflow: hidden;
}

.lang-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 0.9rem;
}

.lang-row-name small {
  color: #888;
}

.lang-accent-row {
  border-top: 1px solid #eee;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.accent-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
}

.lang-accent-row select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #fff;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.lang-remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
  transition: color 0.15s, background 0.15s;
}

.lang-remove-btn:hover {
  color: #c62828;
  background: #fff3f3;
}

.add-lang-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-lang-row select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.cancel-add-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
  white-space: nowrap;
  transition: background 0.15s;
}

.cancel-add-btn:hover {
  background: #f5f5f5;
}

.add-lang-btn {
  width: 100%;
  padding: 10px 14px;
  background: #fff;
  border: 1px dashed #bbb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}

.add-lang-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #888;
}

.add-lang-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
