import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hoshi-mandala-astro/', // 支援 GitHub Pages 等相對路徑部署
})
