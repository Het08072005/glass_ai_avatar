import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Extract backend base URL for proxy
  const apiTarget = env.VITE_API_URL ? new URL(env.VITE_API_URL).origin : "http://localhost:8000";

  return {
    plugins: [react(), tailwindcss()],

    // Development server configuration
    server: {
      host: true, // allow external access (e.g., through Caddy)
      allowedHosts: ["ui.34.235.32.139.nip.io"], // explicitly whitelist your domain

      // Configure HMR for production (AWS) if using the nip.io domain
      hmr: apiTarget.includes("nip.io") ? {
        clientPort: 443
      } : undefined,

      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },

    // Production build optimization
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development', // Only generate sourcemaps in development
      minify: 'terser', // Better minification for production
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'livekit-vendor': ['livekit-client', '@livekit/components-react'],
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
    },
  };
})
