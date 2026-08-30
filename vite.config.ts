/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Binds to 0.0.0.0 (not just localhost) so a phone on the same Wi-Fi can
  // reach the dev server at the PC's LAN address — required for the
  // "スマホ実機" Human Check step (DEVELOPMENT.md).
  server: {
    host: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules', 'e2e'],
  },
})
