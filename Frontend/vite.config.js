import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import tailwindcss from '@tailwindcss/vite' // 1. Import it

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
  ],
=======

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
>>>>>>> e191ccd52eb9629adc4dcee9d7472610f20c5cfa
})
