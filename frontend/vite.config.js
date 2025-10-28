import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // ⚠️ Aumenta el límite de aviso
    rollupOptions: {
      output: {
        // 🔹 Divide dependencias grandes en chunks separados
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: [
            'axios',
            'html2canvas',
            'jspdf',
            'react-router-dom',
            'recharts',
          ],
        },
      },
    },
  },
})
