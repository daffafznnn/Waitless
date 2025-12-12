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
      console.warn('Auth initialization failed in admin middleware:', error)
    }
  }

  // Check if user is authenticated
  if (!isAuthenticated.value || !user.value) {
    return navigateTo('/admin/login')
  }

  // Check if user has ADMIN role
  if (user.value.role !== 'ADMIN') {
    // If user is OWNER, redirect to their dashboard
    if (user.value.role === 'OWNER') {
      return navigateTo('/owner/dashboard')
    }
    // For other roles or no role, redirect to login
    return navigateTo('/admin/login')
  }
})