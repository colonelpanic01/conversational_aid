import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Use named import instead of default

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Make it accessible from any device in your network
    port: 5173
  },
  plugins: [
    react(),
    
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-cache',
            },
          },
        ],
      },
    }),
  ],
});
