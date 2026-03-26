import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/app/**/*.{ts,tsx}'],
      exclude: ['src/app/types/**', 'src/app/pages/**'],
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@components': path.resolve(__dirname, './src/app/components'),
      '@pages': path.resolve(__dirname, './src/app/pages'),
      '@services': path.resolve(__dirname, './src/app/services'),
      '@stores': path.resolve(__dirname, './src/app/stores'),
      '@hooks': path.resolve(__dirname, './src/app/hooks'),
      '@utils': path.resolve(__dirname, './src/app/utils'),
      '@types': path.resolve(__dirname, './src/app/types'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
