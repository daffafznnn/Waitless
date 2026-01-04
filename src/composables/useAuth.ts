/* FILE: src/composables/useAuth.ts */
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest } from '~/types'

export const useAuth = () => {
  const authStore = useAuthStore()
  const authApi = useAuthApi()

  // Login
  const login = async (credentials: LoginRequest) => {
    try {
      authStore.setLoading(true)
      authStore.clearError('login')
      authStore.loginError = null // Clear any previous login error
      
      const response = await authApi.login(credentials)
      
      if (response.ok && response.data) {
        authStore.setUser(response.data.user)
        authStore.setAuthenticated(true)
        return response.data
      } else {
        // Clear any stale auth state on login failure
        authStore.loginError = response.error || 'Login gagal'
        authStore.setError('login', response.error || 'Login failed')
        authStore.setAuthenticated(false)
        authStore.user = null
        throw new Error(response.error || 'Login failed')
      }
    } catch (error: any) {
      // Ensure auth state is cleared on any error
      authStore.loginError = error.message || 'Login gagal'
      authStore.setError('login', error.message || 'Login failed')
      authStore.setAuthenticated(false)
      authStore.user = null
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  // Register
  const register = async (data: RegisterRequest) => {
    try {
      authStore.setLoading(true)
      authStore.clearError('register')
      
      const response = await authApi.register(data)
      
      if (response.ok && response.data) {
        authStore.setUser(response.data.user)
        authStore.setAuthenticated(true)
        return response.data
      } else {
        authStore.setError('register', response.error || 'Registration failed')
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error: any) {
      authStore.setError('register', error.message || 'Registration failed')
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    try {
      authStore.setLoading(true)
      await authApi.logout()
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      // Clear store regardless of API response
      authStore.clearAuth()
      authStore.setLoading(false)
      
      // Redirect to appropriate login page if on client
      if (import.meta.client) {
        const currentPath = useRoute().path
        if (currentPath.startsWith('/admin')) {
          await navigateTo('/admin/login')
        } else if (currentPath.startsWith('/owner')) {
          await navigateTo('/owner/login')
        } else {
          // Default to homepage for visitor/general logout
          await navigateTo('/')
        }
      }
    }
  }

  // Get current user profile
  const me = async () => {
    try {
      authStore.setLoading(true)
      const response = await authApi.getProfile()
      
      if (response.ok && response.data) {
        authStore.setUser(response.data.user)
        authStore.setAuthenticated(true)
        return response.data.user
      }
      
      // Clear auth if request failed
      authStore.clearAuth()
      return null
    } catch (error) {
      authStore.clearAuth()
      return null
    } finally {
      authStore.setLoading(false)
    }
  }

  // Update profile
  const updateProfile = async (data: UpdateProfileRequest) => {
    try {
      authStore.setLoading(true)
      authStore.clearError('updateProfile')
      
      const response = await authApi.updateProfile(data)
      
      if (response.ok && response.data) {
        authStore.setUser(response.data.user)
        return response.data.user
      } else {
        authStore.setError('updateProfile', response.error || 'Profile update failed')
        throw new Error(response.error || 'Profile update failed')
      }
    } catch (error: any) {
      authStore.setError('updateProfile', error.message || 'Profile update failed')
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  // Change password
  const changePassword = async (data: ChangePasswordRequest) => {
    try {
      authStore.setLoading(true)
      authStore.clearError('changePassword')
      
      const response = await authApi.changePassword(data)
      
      if (response.ok) {
        return response.data
      } else {
        authStore.setError('changePassword', response.error || 'Password change failed')
        throw new Error(response.error || 'Password change failed')
      }
    } catch (error: any) {
      authStore.setError('changePassword', error.message || 'Password change failed')
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  // Initialize auth state (check if user is logged in)
  const initializeAuth = async (): Promise<void> => {
    // Skip on server-side or if already initialized
    if (!import.meta.client || authStore.initialized) {
      return
    }

    try {
      const user = await me()
      authStore.setInitialized(true)
      
      if (user) {
        console.log('User authenticated:', user.email)
      }
    } catch (error) {
      console.warn('Auth initialization failed:', error)
      authStore.setInitialized(true)
    }
  }

  // Check if user has specific role
  const hasRole = (role: string | string[]): boolean => {
    const user = authStore.user
    if (!user) return false
    
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.role)
  }

  // Check if user is admin or owner
  const isAdmin = (): boolean => {
    return hasRole(['ADMIN', 'OWNER'])
  }

  // Check if user is owner
  const isOwner = (): boolean => {
    return hasRole('OWNER')
  }

  return {
    // Methods
    login,
    register,
    logout,
    me,
    updateProfile,
    changePassword,
    initializeAuth,
    
    // Utilities
    hasRole,
    isAdmin,
    isOwner,
    
    // Computed state
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    initialized: computed(() => authStore.initialized)
  }
}