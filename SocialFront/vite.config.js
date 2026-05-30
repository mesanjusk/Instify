import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isDesktop = process.env.VITE_IS_DESKTOP === 'true';

export default defineConfig({
  base: isDesktop ? './' : '/',
  plugins: [
    react(),
    VitePWA({
      disabled: isDesktop,
      registerType: 'autoUpdate',
      // Use a distinct filename so public/sw.js (push handler) is not overwritten
      filename: 'workbox-sw.js',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // Offline fallback for navigation requests
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/f\//],
        runtimeCaching: [
          // WhatsApp chats — network-first with fallback
          {
            urlPattern: /\/api\/baileys\/(chats|messages)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wa-api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          // Core API data — network-first, 8s timeout
          {
            urlPattern: /\/api\/(students|leads|admissions|courses|batches|exams|fees|attendance)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 300, maxAgeSeconds: 86400 },
            },
          },
          // Cloudinary images — cache-first, 30 days
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-media',
              expiration: { maxEntries: 500, maxAgeSeconds: 2592000 },
            },
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 7 } },
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
        orientation: 'any',
        categories: ['education', 'business', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Dashboard', url: '/dashboard', description: 'Open Dashboard' },
          { name: 'Add Lead', url: '/add-lead', description: 'Add new enquiry' },
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
