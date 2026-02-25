import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Copia el worker de PDF.js a dist con nombre fijo para que la URL sea predecible (base + pdf.worker.min.mjs)
function copyPdfWorker() {
  return {
    name: 'copy-pdf-worker',
    closeBundle() {
      const src = resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
      const outDir = resolve(__dirname, 'dist')
      const dest = resolve(outDir, 'pdf.worker.min.mjs')
      if (existsSync(src)) {
        if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
        copyFileSync(src, dest)
      }
    }
  }
}

export default defineConfig({
  base: '/PrevioMX/',
  plugins: [react(), copyPdfWorker()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

