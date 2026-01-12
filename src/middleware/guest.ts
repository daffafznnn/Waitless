export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip on server-side during SSR
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, user, initializeAuth } = useAuth()
  const authStore = useAuthStore()

  // If there's a recent login error, don't redirect (stay on login page)
  if (authStore.loginError) {
    authStore.loginError = null // Clear the error flag
    return
  }

  // Initialize auth state if not already done
  if (!user.value && !isAuthenticated.value) {
    try {
      await initializeAuth()
    } catch (error) {
      console.warn('Auth initialization failed in guest middleware:', error)
    }
  }

  // Check again after initialization
  if (isAuthenticated.value && user.value) {
    const userRole = user.value.role
    
    // Redirect ADMIN and OWNER to their dashboards
    // But allow VISITOR to access login/register pages freely
    switch (userRole) {
      case 'ADMIN':
        return navigateTo('/admin/dashboard')
      case 'OWNER':
        return navigateTo('/owner/dashboard')
      default:
        // VISITOR can access login page freely (no redirect)
        return
    }
  }
})