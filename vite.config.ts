import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/cv-api': {
        target: 'https://api.commonvoice.mozilla.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cv-api/, ''),
      },
    },
  },
})
