import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build timestamp to force unique output files and bust Railway cache
const BUILD_TS = Date.now();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/app-${BUILD_TS}-[hash].js`,
        chunkFileNames: `assets/chunk-${BUILD_TS}-[hash].js`,
        assetFileNames: `assets/style-${BUILD_TS}-[hash].[ext]`,
      }
    },
    emptyOutDir: true,
  }
})
