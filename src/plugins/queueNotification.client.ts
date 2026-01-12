/**
 * Queue Notification Provider Plugin
 * Initializes real-time notification polling on app load
 */
export default defineNuxtPlugin(() => {
  // Only run on client
  if (!process.client) return

  const authStore = useAuthStore()
  let notificationComposable: ReturnType<typeof useQueueNotification> | null = null
  
  // Initialize notifications when auth state is ready
  const initializeNotifications = () => {
    if (authStore.isAuthenticated && !notificationComposable) {
      // Use the composable in the app context
      notificationComposable = useQueueNotification()
    }
  }
  
  // Watch for auth state changes
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth) {
      initializeNotifications()
    } else if (notificationComposable) {
      notificationComposable.stopPolling()
      notificationComposable.clearAllState()
      notificationComposable = null
    }
  }, { immediate: true })
  
  return {
    provide: {
      queueNotification: {
        initialize: initializeNotifications,
        getComposable: () => notificationComposable
      }
    }
  }
})
