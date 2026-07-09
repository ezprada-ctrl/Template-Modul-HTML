import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // expose on the LAN so teammates can open this from their own computer
    host: true,
  },
})
