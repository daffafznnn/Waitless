/* FILE: nuxt.config.ts */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'src/',
  
  devServer: {
    port: 3000,
    host: '0.0.0.0' // Enable LAN access
  },

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  // CSS Configuration
  css: ['~/styles/globals.css'],

  // Runtime Configuration
  runtimeConfig: {
    // Private keys (only available on server-side)
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
    
    // Backend host for LAN access (set via environment or auto-detect)
    backendHost: process.env.BACKEND_HOST || '0.0.0.0',
    backendPort: process.env.BACKEND_PORT || '3002',
    
    // Public keys (exposed to client-side)
    public: {
      apiBaseUrl: process.env.NODE_ENV === 'development' ? '/api' : process.env.API_BASE_URL || 'http://localhost:3002/api',
      appName: 'Waitless',
      version: '1.0.0'
    }
  },

  // Nitro Configuration (for development proxy)
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3002/api',
        changeOrigin: true,
        prependPath: true
      }
    },
    ignore: ['src/server/**/*']
  },

  // TypeScript Configuration
  typescript: {
    typeCheck: false
  },

  // App Configuration
  app: {
    head: {
      title: 'Waitless - Queue Management System',
      htmlAttrs: {
        lang: 'id'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Modern queue management system for businesses' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Preconnect to Google for faster avatar loading
        { rel: 'preconnect', href: 'https://lh3.googleusercontent.com' },
        { rel: 'preconnect', href: 'https://api.dicebear.com' }
      ],
      // Inline CSS to prevent flash of unstyled content
      style: [
        {
          innerHTML: `
            html:not(.hydrated) body { opacity: 0; }
            html.hydrated body { opacity: 1; transition: opacity 0.15s ease-in-out; }
          `
        }
      ],
      // Script to mark as hydrated when ready
      script: [
        {
          innerHTML: `
            window.addEventListener('load', function() {
              setTimeout(function() {
                document.documentElement.classList.add('hydrated');
              }, 50);
            });
          `
        }
      ]
    },
    // Page transition for smoother navigation
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  // Route Rules for SSR/SPA
  routeRules: {
    // Homepage rendered on client-side (disable prerendering)
    '/': { spa: true },
    // Admin dashboard renders only on client-side
    '/admin/**': { spa: true },
    '/owner/**': { spa: true },
    // Hybrid rendering for queue pages
    '/queue/**': { spa: true }
  },

  // Experimental features
  experimental: {
    payloadExtraction: false
  },

  // Suppress development warnings
  ignore: [
    '**/#app-manifest'
  ],

  // Build configuration
  build: {
    analyze: false
  },

  // PostCSS Configuration
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // Vite configuration
  vite: {
    build: {
      rollupOptions: {
        external: ['src/server/**/*']
      }
    },
    // Suppress harmless import errors in development
    optimizeDeps: {
      exclude: ['#app-manifest']
    },
    // Complete suppress of import analysis for virtual modules
    server: {
      fs: {
        allow: ['..']
      }
    },
    plugins: [
      {
        name: 'suppress-warnings',
        configResolved() {
          const originalWarn = console.warn
          console.warn = (...args) => {
            const message = args.join(' ')
            if (message.includes('#app-manifest') || 
                message.includes('postcss.config.js') ||
                message.includes('Pre-transform error')) {
              return
            }
            originalWarn(...args)
          }
        }
      }
    ]
  },

  // Suppress warnings and logs
  logLevel: 'info',
  
  // Additional configuration to suppress warnings
  hooks: {
    'vite:extendConfig': (config, { isClient, isServer }) => {
      if (config.define) {
        config.define['import.meta.env.NUXT_DEV'] = JSON.stringify(true)
      }
      
      // Suppress import analysis warnings
      if (isClient) {
        config.onwarn = (warning, warn) => {
          if (warning.code === 'UNRESOLVED_IMPORT') return
          if (warning.message.includes('#app-manifest')) return
          if (warning.message.includes('postcss.config.js')) return
          warn(warning)
        }
      }
    }
  }
})