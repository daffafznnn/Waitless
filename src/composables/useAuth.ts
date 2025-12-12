/* FILE: src/composables/useAuth.ts */
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '~/types'

export const useAuth = () => {
  const { get, post } = useApi()
  const authStore = useAuthStore()

  // Login
  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await post<{ user: User }>('/auth/login', credentials)
      
      if (response.ok && response.data) {
        // Update store
        authStore.setUser(response.data.user)
        authStore.setAuthenticated(true)
        
        return {
          ok: true,
          data: response.data
        }
      }
      
      return response as AuthResponse
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Login failed'
      }
    }
  }

  // Register
  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await post<{ user: User }>('/auth/register', data)
      
      if (response.ok && response.data) {
        // Update store
        authStore.setUser(response.data.user)
        authStore.setAuthenticated(true)
        
        return {
          ok: true,
          data: response.data
        }
      }
      
      return response as AuthResponse
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Registration failed'
      }
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await post('/auth/logout')
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      // Clear store regardless of API response
      authStore.clearAuth()
      
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
  const me = async (): Promise<User | null> => {
    try {
      const response = await get<User>('/auth/me')
      
      if (response.ok && response.data) {
        authStore.setUser(response.data)
        authStore.setAuthenticated(true)
        return response.data
      }
      
      // Clear auth if request failed
      authStore.clearAuth()
      return null
    } catch (error) {
      authStore.clearAuth()
      return null
    }
  }

  // Update profile
  const updateProfile = async (data: Partial<User>): Promise<AuthResponse> => {
    try {
      const response = await post<User>('/auth/profile', data)
      
      if (response.ok && response.data) {
        authStore.setUser(response.data)
        
        return {
          ok: true,
          data: { user: response.data }
        }
      }
      
      return response as AuthResponse
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Profile update failed'
      }
    }
  }

  // Change password
  const changePassword = async (data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<AuthResponse> => {
    try {
      const response = await post('/auth/change-password', data)
      
      return response as AuthResponse
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Password change failed'
      }
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