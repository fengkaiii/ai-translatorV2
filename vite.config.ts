import { fileURLToPath } from 'node:url'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import manifest from './manifest.config.ts'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'chrome114',
  },
  server: {
    port: 5188,
    strictPort: true,
    // content script 的 HMR 需要固定端口
    hmr: { port: 5188 },
  },
})
