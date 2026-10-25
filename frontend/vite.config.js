import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Deployed as a Render Static Site (npm run build -> dist), so no preview server settings are needed
export default defineConfig({
  plugins: [react(),tailwindcss()],
})
