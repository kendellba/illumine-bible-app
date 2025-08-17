import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
// Removed tailwindcss import - using PostCSS instead

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'

  return {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Remove comments in production
          comments: !isProduction
        }
      }
    }),
    // Only enable devtools in development
    ...(isProduction ? [] : [vueDevTools()]),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.scripture\.api\.bible\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 3
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: env.VITE_APP_NAME || 'Illumine Bible App',
        short_name: 'Illumine',
        description: 'A modern, offline-first Bible study application',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['education', 'books', 'lifestyle'],
        lang: 'en',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // Enable code splitting and optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'db-vendor': ['dexie'],
          'utils-vendor': ['zod'],

          // Feature-based chunks
          'bible-reader': [
            './src/views/BibleReaderView.vue',
            './src/components/BibleText.vue',
            './src/components/VirtualizedBibleText.vue',
            './src/components/BibleNavigation.vue',
            './src/components/VerseComponent.vue'
          ],
          'search-features': [
            './src/views/SearchView.vue',
            './src/composables/useSearch.ts'
          ],
          'user-content': [
            './src/views/BookmarksView.vue',
            './src/views/NotesView.vue',
            './src/components/VerseActions.vue'
          ],
          'settings-features': [
            './src/views/SettingsView.vue',
            './src/components/BibleVersionManager.vue',
            './src/components/StorageManager.vue'
          ]
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const name = facadeModuleId.split('/').pop()?.replace('.vue', '') || 'chunk'
            return `js/${name}-[hash].js`
          }
          return 'js/[name]-[hash].js'
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      },
      // External dependencies that should not be bundled
      external: (id) => {
        // Keep all dependencies bundled for PWA offline functionality
        return false
      }
    },
    // Optimize build settings
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProduction, // Remove console.log only in production
        drop_debugger: isProduction,
        pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : []
      },
      mangle: {
        safari10: true
      }
    },
    // Source maps for debugging (enable in development, disable in production)
    sourcemap: !isProduction,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold
    assetsInlineLimit: 4096
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@supabase/supabase-js',
      'dexie',
      'zod'
    ],
    exclude: [
      // Exclude large dependencies that should be loaded on demand
    ]
  },
  // Performance optimizations
  esbuild: {
    // Remove unused imports
    treeShaking: true,
    // Optimize for modern browsers
    target: 'esnext'
  },
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
    __APP_ENVIRONMENT__: JSON.stringify(mode),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  // Server configuration for development
  server: {
    port: 3000,
    host: true,
    // Security headers for development
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
  }
})
