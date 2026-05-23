import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = 'http://localhost:5001'

const proxyRoutes = [
  '/clientes',
  '/cuentas',
  '/tarjetas',
  '/pagos',
  '/api',
  '/reportes',
  '/seed',
  '/scalar',
  '/openapi',
] as const

const proxy = Object.fromEntries(
  proxyRoutes.map((route) => [
    route,
    {
      target: API_TARGET,
      changeOrigin: true,
      secure: false,
    },
  ]),
)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5170,
    strictPort: true,
    proxy,
  },
  preview: {
    port: 5170,
  },
  build: {
    outDir: '../BancoApi/wwwroot',
    emptyOutDir: true,
  },
})
