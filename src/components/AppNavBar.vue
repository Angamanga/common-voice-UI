<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDatasetStore } from '@/stores/dataset'
import { computed, ref } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const datasetStore = useDatasetStore()

const isLoggedIn = computed(() => !!userStore.userId)
const showProfile = ref(false)

const avatarInitials = computed(() =>
  (userStore.email ?? '').charAt(0).toUpperCase() || 'U'
)

const emit = defineEmits<{
  logout: []
  languageChange: [code: string]
  openSettings: []
}>()

function onLogout() {
  showProfile.value = false
  emit('logout')
}

function onOpenSettings() {
  showProfile.value = false
  emit('openSettings')
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

      <!-- Profile avatar + dropdown -->
      <div v-if="isLoggedIn" class="profile-wrap">
        <button class="avatar" @click="showProfile = !showProfile" :aria-expanded="showProfile">
          {{ avatarInitials }}
        </button>

        <template v-if="showProfile">
          <!-- click-away backdrop -->
          <div class="backdrop" @click="showProfile = false" />

          <div class="dropdown">
            <!-- Languages & accents -->
            <div class="dropdown-section">
              <p class="dropdown-section-label">Languages</p>
              <div
                v-for="code in datasetStore.selectedCodes"
                :key="code"
                class="profile-lang-row"
              >
                <span class="profile-lang-name">
                  {{ datasetStore.languages.find(l => l.code === code)?.name ?? code }}
                </span>
                <span v-if="userStore.accentCodes[code]" class="profile-lang-accent">
                  {{ datasetStore.languages.find(l => l.code === code)?.predefined_accents.find(a => a.code === userStore.accentCodes[code])?.name ?? userStore.accentCodes[code] }}
                </span>
              </div>
            </div>

            <!-- Demographics -->
            <div v-if="userStore.age || userStore.gender" class="dropdown-section">
              <p class="dropdown-section-label">Demographics</p>
              <p v-if="userStore.age" class="profile-detail">Age: {{ userStore.age }}</p>
              <p v-if="userStore.gender" class="profile-detail">Gender: {{ userStore.gender }}</p>
            </div>

            <div class="dropdown-divider" />

            <button class="dropdown-item" @click="onOpenSettings">Edit profile</button>
            <button class="dropdown-item dropdown-item--danger" @click="onLogout">Log out</button>
          </div>
        </template>
      </div>
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

/* Profile */
.profile-wrap {
  position: relative;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ff4f5e;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.avatar:hover { opacity: 0.85; }

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
}

.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 220px;
  z-index: 11;
  overflow: hidden;
}

.dropdown-section {
  padding: 12px 16px;
}

.dropdown-section + .dropdown-section {
  border-top: 1px solid #f0f0f0;
}

.dropdown-section-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}

.profile-lang-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.profile-lang-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f0f0f;
}

.profile-lang-accent {
  font-size: 0.78rem;
  color: #888;
  text-align: right;
}

.profile-detail {
  font-size: 0.875rem;
  color: #444;
  margin: 2px 0;
}

.dropdown-divider {
  height: 1px;
  background: #f0f0f0;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 11px 16px;
  font-size: 0.875rem;
  color: #333;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
}

.dropdown-item:hover { background: #f5f5f5; }

.dropdown-item--danger { color: #c62828; }
.dropdown-item--danger:hover { background: #fff3f3; }

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
}
</style>
