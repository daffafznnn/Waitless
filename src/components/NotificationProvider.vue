<script setup lang="ts">
/**
 * NotificationProvider Component
 * Wraps the app and initializes queue notification polling
 * Must be placed at app level (app.vue or layout)
 */
import { useQueueNotification } from '~/composables/useQueueNotification'

const authStore = useAuthStore()

// Only initialize if authenticated
const notification = authStore.isAuthenticated ? useQueueNotification() : null

// Re-initialize when auth state changes
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && !notification) {
    // Page will re-render with proper initialization
    navigateTo(useRoute().fullPath)
  }
})
</script>

<template>
  <slot />
</template>
