import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { integratedServer } from './server'

// https://vitejs.dev/config/
export default defineConfig({
  // The backend server is integrated as a Vite plugin.
  plugins: [react(), integratedServer()],
  server: {
    // Both frontend and backend are now served from this single port over HTTP.
    port: 4000,
    strictPort: true,
  },
  define: {
    // Expose environment variables to the client
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})