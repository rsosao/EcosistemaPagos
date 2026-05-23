import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = 'http://localhost:5004'

const proxyPaths = [
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
    port: 5173,
    proxy: Object.fromEntries(
      proxyPaths.map((p) => [
        p,
        { target: apiTarget, changeOrigin: true, secure: false },
      ]),
    ),
  },
  build: {
    outDir: '../EnergiaApi/wwwroot',
    emptyOutDir: true,
  },
})
