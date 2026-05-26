import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isDesktop = process.env.VITE_IS_DESKTOP === 'true';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      disabled: isDesktop,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/api\/baileys\/(chats|messages)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wa-api-cache',
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-media',
            },
          },
        ],
      },
      manifest: {
        name: 'Instify',
        short_name: 'Instify',
        description: 'Institutions Simplified',
        theme_color: '#1a7a4a',
        background_color: '#f4f9f6',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'mui-core':      ['@mui/material', '@mui/system'],
          'mui-icons':     ['@mui/icons-material'],
          'fabric':        ['fabric'],
          'pdf-zip':       ['jspdf', 'jszip'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
