<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDatasetStore } from '@/stores/dataset'
import { useUserStore } from '@/stores/user'

const emit = defineEmits<{ done: [] }>()

const datasetStore = useDatasetStore()
const userStore = useUserStore()

const SWEDISH_FALLBACK = { code: 'sv-SE', name: 'Swedish' }

const selectedCode = ref(datasetStore.selectedCode || SWEDISH_FALLBACK.code)
const selectedAge = ref(userStore.age ?? '')
const selectedGender = ref(userStore.gender ?? '')
const selectedVariant = ref(userStore.variantCode ?? '')
const selectedAccent = ref(userStore.accentCode ?? '')
const loading = ref(false)
const error = ref<string | null>(null)

const AGE_RANGES = ['', 'teens', 'twenties', 'thirties', 'forties', 'fifties', 'sixties', 'seventies', 'eighties', 'nineties']
const GENDERS = ['', 'male', 'female', 'other', 'prefer not to say']

// Fetch in background to populate dropdown; Swedish fallback is always available
onMounted(() => {
  if (datasetStore.datasets.length === 0) {
    datasetStore.fetchDatasets().then(() => {
      if (!selectedCode.value) selectedCode.value = datasetStore.selectedCode
    }).catch(() => { /* non-blocking — Swedish fallback covers this */ })
  }
})

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
    // await userStore.createUser(userStore.getDemographics())
    emit('done')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Setup failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <h2 class="modal-title">Welcome to Common Voice</h2>
      <p class="modal-subtitle">Choose a language and optionally share demographic info to improve voice data quality.</p>

      <div v-if="error" class="error-banner">{{ error }}</div>

      <div class="field">
        <label>Language / Dataset</label>
        <select v-model="selectedCode">
          <!-- Always present Swedish fallback so the modal is never broken -->
          <option :value="SWEDISH_FALLBACK.code">
            {{ SWEDISH_FALLBACK.name }} ({{ SWEDISH_FALLBACK.code }})
          </option>
          <template v-if="datasetStore.datasets.length > 0">
            <option
              v-for="ds in datasetStore.datasets.filter(d => d.code !== SWEDISH_FALLBACK.code)"
              :key="ds.code"
              :value="ds.code"
            >
              {{ ds.name }} ({{ ds.code }})
            </option>
          </template>
          <option v-else-if="datasetStore.loading" disabled value="">Loading more…</option>
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
</style>
