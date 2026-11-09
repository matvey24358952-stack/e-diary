import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // Keep the URL stable: the browser grants microphone access per origin,
    // and a different port means a different origin where voice input is blocked.
    strictPort: true,
    watch: {
      ignored: [
        '**/.android/**',
        '**/.gradle/**',
        '**/.tmp/**',
        '**/.npm-cache/**',
        '**/android/**',
        '**/tools/**',
        '**/dist/**'
      ]
    }
  },
  build: { target: 'es2019' }
})
