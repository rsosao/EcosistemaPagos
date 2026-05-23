import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = 'http://localhost:5003'

const proxyTargets = [
  '/clientes',
  '/generar-cuotas',
  '/pagar',
  '/api',
  '/tesoreria',
  '/reportes',
  '/seed',
  '/scalar',
  '/openapi',
]

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5172,
    strictPort: true,
    proxy: Object.fromEntries(
      proxyTargets.map((p) => [p, { target: API_TARGET, changeOrigin: true }]),
    ),
  },
  build: {
    outDir: '../TelefoniaApi/wwwroot',
    emptyOutDir: true,
  },
})
