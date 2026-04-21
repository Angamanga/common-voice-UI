<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const emit = defineEmits<{ done: [] }>()

const userStore = useUserStore()
const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

async function submit() {
  if (!isValidEmail(email.value)) {
    error.value = 'Please enter a valid email address.'
    return
  }
  loading.value = true
  error.value = null
  try {
    const username = email.value.split('@')[0]
    await userStore.createUser({ email: email.value, username })
    emit('done')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <div class="modal-icon">🎙</div>
      <h2 class="modal-title">Welcome to Common Voice</h2>
      <p class="modal-subtitle">
        Enter your email so your recordings are linked to your account.
        No password needed.
      </p>

      <div v-if="error" class="error-banner">{{ error }}</div>

      <div class="field">
        <label for="email-input">Email address</label>
        <input
          id="email-input"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          :disabled="loading"
          @keydown.enter="submit"
        />
      </div>

      <button class="submit-btn" :disabled="loading || !email" @click="submit">
        <span v-if="loading" class="spinner" />
        <span v-else>Continue</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.modal-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f0f0f;
  margin: 0 0 8px;
}

.modal-subtitle {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin: 0 0 28px;
}

.error-banner {
  background: #fff3f3;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 16px;
  text-align: left;
}

.field {
  margin-bottom: 20px;
  text-align: left;
}

.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #0f0f0f;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input:focus {
  border-color: #0095ff;
  box-shadow: 0 0 0 3px rgba(0, 149, 255, 0.15);
}

.field input:disabled {
  background: #f5f5f5;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  background: #0f0f0f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s;
}

.submit-btn:hover:not(:disabled) {
  background: #333;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
