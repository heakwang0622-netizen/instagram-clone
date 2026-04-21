import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const devApiPort: string = require('../scripts/dev-proxy-port.js')()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: true,
    proxy: {
      // 브라우저는 항상 같은 출처로만 요청 → CORS·포트 변경(5177 등)에도 안전
      '/api': {
        target: `http://127.0.0.1:${devApiPort}`,
        changeOrigin: true,
      },
      '/media': {
        target: `http://127.0.0.1:${devApiPort}`,
        changeOrigin: true,
      },
    },
  },
})
