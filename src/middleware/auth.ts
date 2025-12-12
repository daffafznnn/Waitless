export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, user } = useAuth()

  // Check if user is authenticated
  if (!isAuthenticated.value) {
    // Redirect to appropriate login page based on route
    if (to.path.includes('/admin')) {
      return navigateTo('/admin/login')
    } else if (to.path.includes('/owner')) {
      return navigateTo('/owner/login')
    } else {
      // Default to admin login
      return navigateTo('/admin/login')
    }
  }

  // Check role-based access
  if (user.value) {
    const userRole = user.value.role
    
    // Admin routes - only ADMIN role can access
    if (to.path.includes('/admin')) {
      if (userRole !== 'ADMIN') {
        // If user is OWNER but trying to access admin, redirect to owner dashboard
        if (userRole === 'OWNER') {
          return navigateTo('/owner/dashboard')
        }
        // For other roles, redirect to login
        return navigateTo('/admin/login')
      }
    }
    
    // Owner routes - only OWNER role can access
    if (to.path.includes('/owner')) {
      if (userRole !== 'OWNER') {
        // If user is ADMIN but trying to access owner, redirect to admin dashboard
        if (userRole === 'ADMIN') {
          return navigateTo('/admin/dashboard')
        }
        // For other roles, redirect to login
        return navigateTo('/owner/login')
      }
    }
  }
})