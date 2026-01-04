import { debugAuthStorage } from '~/utils/auth-debug'

export default defineNuxtPlugin(async () => {
  // Only run on client-side
  if (import.meta.server) return

  const { initializeAuth } = useAuth()
  const authStore = useAuthStore()
  

  
  try {
    debugAuthStorage()
    const loaded = authStore.loadFromStorage()
    
    if (loaded && authStore.user && authStore.isAuthenticated) {
      authStore.setInitialized(true)
      
      try {
        await initializeAuth()
      } catch (error) {
        // Server verification failed but we still have valid localStorage data
        // Keep the local state - user is still "logged in" for UI purposes
        console.warn('Server verification failed, keeping local auth state:', error)
      }
    } else {
      console.log('No valid auth state in localStorage, checking server...')
      // Initialize authentication state from server
      await initializeAuth()
    }
  } catch (error) {
    console.warn('Failed to initialize auth on app start:', error)
    // Only clear if there was no localStorage state to begin with
    if (!authStore.user) {
      authStore.clearAuth()
    }
    authStore.setInitialized(true)
  }
})