<!-- FILE: src/app.vue -->
<template>
  <div id="app" class="min-h-screen bg-surface-50">
    <!-- Global loading indicator -->
    <div v-if="pending" class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex items-center space-x-2">
        <div class="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-medium text-surface-600">Loading...</span>
      </div>
    </div>

    <!-- Main app content -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global notifications -->
    <div id="notifications-portal" class="fixed top-4 right-4 z-40 max-w-sm"></div>
    
    <!-- Global modals -->
    <div id="modal-portal"></div>
  </div>
</template>

<script setup lang="ts">
// App-level configuration
useHead({
  titleTemplate: '%s - Waitless',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#2563eb' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
  ],
  link: [
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})

// Global pending state for route transitions
const { pending } = useLazyAsyncData('app-init', () => {
  // Any app-level initialization can go here
  return Promise.resolve()
})

// Initialize auth state if user is logged in
const { initializeAuth } = useAuth()
onMounted(async () => {
  await initializeAuth()
})

// Global error handling
const handleError = (error: any) => {
  console.error('Global error:', error)
  // You can implement global error reporting here
}

// Listen for unhandled promise rejections
if (import.meta.client) {
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason)
  })
}
</script>

<style>
/* Additional global styles if needed */
</style>