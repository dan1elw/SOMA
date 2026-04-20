import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      // skipWaiting: false (default via 'prompt') — a new SW waits until the
      // user acknowledges the update. This prevents version mismatches between
      // the running React bundle and newly precached chunks mid-session.
      // workbox-window surfaces a 'waiting' event that OfflineBanner can use
      // to show an "Update available — reload" prompt in Phase 8.
      manifest: false, // manifest.webmanifest is hand-authored in public/
      workbox: {
        // App-shell: precache everything Vite emits (JS/CSS/HTML chunks).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        runtimeCaching: [
          {
            // CARTO Dark Matter map tiles — CacheFirst, 7-day TTL.
            // Scoped to the CARTO origin only to avoid accidentally caching
            // CelesTrak OMM responses (those are handled by IndexedDB).
            urlPattern: ({ url }) => url.origin === 'https://basemaps.cartocdn.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
})
