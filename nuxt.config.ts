/* FILE: nuxt.config.ts */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'src/',
  
  devServer: {
    port: 3000
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
    
    // Public keys (exposed to client-side)
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3002/api',
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
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Modern queue management system for businesses' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
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

  // Vite configuration
  vite: {
    build: {
      rollupOptions: {
        external: ['src/server/**/*']
      }
    }
  }
})