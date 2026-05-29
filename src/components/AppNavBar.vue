<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDatasetStore } from '@/stores/dataset'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const datasetStore = useDatasetStore()

const isLoggedIn = computed(() => !!userStore.userId)

const emit = defineEmits<{
  logout: []
  languageChange: [code: string]
}>()

function onLogout() {
  emit('logout')
}

function onLanguageChange(code: string) {
  datasetStore.selectLanguage(code)
  emit('languageChange', code)
}

const tabs = [
  { label: 'Speak', icon: '🎤', route: '/speak' },
]

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-left">
      <div class="logo">
        <img
          src="@/assets/mvdc-logo.png"
          alt="MVDC - Every Voice Matters"
          class="logo-img"
        />
      </div>
    </div>

    <nav class="navbar-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.route"
        class="tab-btn"
        :class="{ active: route.path === tab.route }"
        @click="navigate(tab.route)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </nav>

    <div class="navbar-right">
      <!-- Language selector -->
      <div class="lang-select-wrap">
        <select
          class="lang-select"
          :value="datasetStore.selectedCode"
          @change="onLanguageChange(($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="lang in datasetStore.languages.filter(l => datasetStore.selectedCodes.includes(l.code))"
            :key="lang.code"
            :value="lang.code"
          >
            {{ lang.name }}
          </option>
        </select>
        <span class="lang-chevron">▾</span>
      </div>

      <!-- User menu -->
      <button v-if="isLoggedIn" class="user-btn" @click="onLogout">
        Log out
      </button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: stretch;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  height: 80px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-left {
  display: flex;
  align-items: center;
  margin-right: 32px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 64px;
  width: auto;
  display: block;
}

.navbar-tabs {
  display: flex;
  align-items: stretch;
  flex: 1;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover { color: #0f0f0f; }

.tab-btn.active {
  color: #0095ff;
  border-bottom-color: #0095ff;
}

.tab-icon { font-size: 0.8rem; }

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

/* Language select */
.lang-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.lang-select {
  appearance: none;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 5px 28px 5px 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.lang-select:hover,
.lang-select:focus {
  border-color: #aaa;
}

.lang-chevron {
  position: absolute;
  right: 8px;
  font-size: 0.7rem;
  color: #888;
  pointer-events: none;
}

/* User menu */
.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.user-btn:hover { background: #f5f5f5; }

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ff4f5e;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.username {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f0f0f;
}

.chevron {
  font-size: 0.75rem;
  color: #888;
  transition: transform 0.15s;
}

.chevron.open { transform: rotate(180deg); }

@media (max-width: 640px) {
  .navbar {
    padding: 0 12px;
    height: 48px;
  }
  .navbar-left {
    margin-right: 8px;
  }
  .logo-img {
    height: 22px;
  }
  .tab-btn {
    padding: 0 10px;
    font-size: 0.8rem;
    gap: 4px;
  }
  .lang-select {
    font-size: 0.78rem;
    padding: 4px 22px 4px 8px;
    max-width: 110px;
  }
  .user-btn {
    font-size: 0.8rem;
    padding: 4px 6px;
  }
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 140px;
  overflow: hidden;
}

.dropdown-item {
  padding: 10px 16px;
  font-size: 0.875rem;
  color: #333;
  cursor: pointer;
}

.dropdown-item:hover { background: #f5f5f5; }
</style>
