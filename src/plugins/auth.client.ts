export default defineNuxtPlugin(async () => {
  // Only run on client-side
  if (import.meta.server) return

  const { initializeAuth } = useAuth()
  const authStore = useAuthStore()
  
  // Import debug utility
  const { debugAuthStorage } = await import('~/utils/auth-debug')
  
  try {
    // Debug current localStorage state
    debugAuthStorage()
    
    // First, try to load state from localStorage
    console.log('Loading auth state from localStorage...')
    const loaded = authStore.loadFromStorage()
    
    if (loaded && authStore.user && authStore.isAuthenticated) {
      console.log('Auth state restored from localStorage:', authStore.user.email)
      
      // Verify the state by checking with server
      try {
        await initializeAuth()
      } catch (error) {
        console.warn('Failed to verify auth with server, clearing local state:', error)
        authStore.clearAuth()
      }
    } else {
      console.log('No valid auth state in localStorage, checking server...')
      // Initialize authentication state from server
      await initializeAuth()
    }
  } catch (error) {
    console.warn('Failed to initialize auth on app start:', error)
    authStore.clearAuth()
  }
})