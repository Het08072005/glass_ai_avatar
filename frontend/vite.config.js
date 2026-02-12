import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: true, // allow external access (e.g., through Caddy)
    allowedHosts: ["ui.34.235.32.139.nip.io"], // explicitly whitelist your domain

    proxy: {
      "/api": {
        target: "https://api.34.235.32.139.nip.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  }
})

