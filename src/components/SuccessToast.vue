<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  message: string
  duration?: number
}>()

const emit = defineEmits<{ close: [] }>()

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
    setTimeout(() => emit('close'), 300)
  }, props.duration ?? 4000)
})
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast">
      <span class="toast-icon">✓</span>
      <span class="toast-msg">{{ message }}</span>
      <button class="toast-close" @click="visible = false; $emit('close')">×</button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #fff;
  padding: 14px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  font-size: 0.9rem;
  z-index: 1000;
  min-width: 240px;
}

.toast-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.toast-msg {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
}

.toast-close:hover {
  color: #fff;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
