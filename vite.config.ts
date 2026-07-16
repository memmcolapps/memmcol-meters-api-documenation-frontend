import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiProxyTarget = env.API_PROXY_TARGET || 'https://sbctest.memmserve.com'
  const proxy = {
    '/powerhub/v1/api': {
      target: apiProxyTarget,
      changeOrigin: true,
    },
  }

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
    ],
    server: { proxy },
    preview: { proxy },
  }
})
