export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip on server-side during SSR
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, user, initializeAuth } = useAuth()

  // Initialize auth state if not already done
  if (!user.value && !isAuthenticated.value) {
    try {
      await initializeAuth()
    } catch (error) {
      console.warn('Auth initialization failed in owner middleware:', error)
    }
  }

  // Check if user is authenticated
  if (!isAuthenticated.value || !user.value) {
    return navigateTo('/owner/login')
  }

  // Check if user has OWNER role
  if (user.value.role !== 'OWNER') {
    // If user is ADMIN, redirect to their dashboard
    if (user.value.role === 'ADMIN') {
      return navigateTo('/admin/dashboard')
    }
    // For other roles or no role, redirect to login
    return navigateTo('/owner/login')
  }
})