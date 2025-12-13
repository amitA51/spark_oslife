import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load all env variables including VITE_ prefixed ones
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        // Allow Google Auth popup to communicate with parent window
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        injectRegister: 'auto',
        strategies: 'injectManifest',
        srcDir: '',
        filename: 'sw.js',
        injectManifest: {
          swSrc: './public/sw-custom.js',
          swDest: './dist/sw.js',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          injectionPoint: undefined,
        },
        manifest: {
          name: 'Spark OS',
          short_name: 'SparkOS',
          description: 'Your Personal Productivity Operating System',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'classic', // Use classic type to support importScripts in sw-custom.js when developing
          navigateFallback: 'index.html',
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(
        env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID
      ),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Performance optimizations
      target: 'es2020',
      minify: false, // TEMP: Disabled for debugging TDZ error
      sourcemap: true, // Temporarily enabled for debugging

      // Bundle splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('firebase')) {
                // Split Firebase into smaller chunks
                if (id.includes('auth')) return 'vendor-firebase-auth';
                if (id.includes('firestore')) return 'vendor-firebase-db';
                if (id.includes('storage')) return 'vendor-firebase-storage';
                return 'vendor-firebase-core';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-framer';
              }
              if (id.includes('date-fns') || id.includes('react-big-calendar')) {
                return 'vendor-calendar';
              }
              if (id.includes('@radix-ui') || id.includes('clsx') || id.includes('tailwind-merge')) {
                return 'vendor-ui';
              }
              return 'vendor-core';
            }

            // Screen-specific chunks for lazy loading
            if (id.includes('/screens/')) {
              if (id.includes('HomeScreen')) {
                return 'screen-home';
              }
              if (id.includes('FeedScreen')) {
                return 'screen-feed';
              }
              if (id.includes('CalendarScreen')) {
                return 'screen-calendar';
              }
              if (id.includes('SettingsScreen')) {
                return 'screen-settings';
              }
              if (id.includes('AssistantScreen')) {
                return 'screen-assistant';
              }
              if (id.includes('LibraryScreen')) {
                return 'screen-library';
              }
              if (id.includes('PasswordManagerScreen')) {
                return 'screen-passwords';
              }
              if (id.includes('SearchScreen')) {
                return 'screen-search';
              }
              if (id.includes('AddScreen')) {
                return 'screen-add';
              }
              if (id.includes('InvestmentsScreen')) {
                return 'screen-investments';
              }
              if (id.includes('ViewsScreen')) {
                return 'screen-views';
              }
              if (id.includes('LoginScreen') || id.includes('SignupScreen')) {
                return 'screen-auth';
              }
            }

            // Feature-specific chunks
            if (id.includes('/components/workout/')) {
              return 'feature-workout';
            }
            if (id.includes('/components/calendar/') || id.includes('CalendarView') || id.includes('FullCalendarView')) {
              return 'feature-calendar';
            }

            return undefined;
          },
          chunkFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProd ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
        },
      },

      // Reduce chunk size warnings threshold
      chunkSizeWarningLimit: 1000,
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion', 'date-fns', 'react-big-calendar'],
      exclude: [
        // Large dependencies that should be loaded on demand
      ],
    },

    // Enable CSS code splitting
    css: {
      devSourcemap: !isProd,
    },
  };
});
