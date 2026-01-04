/* FILE: src/stores/auth.ts */
import { defineStore } from 'pinia'
import type { User } from '~/types'

// Helper functions for localStorage
const AUTH_STORAGE_KEY = 'waitless_auth'

const saveToStorage = (data: any) => {
  if (import.meta.client) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save auth state to localStorage:', error)
    }
  }
}

const loadFromStorage = () => {
  if (import.meta.client) {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Failed to load auth state from localStorage:', error)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
  }
  return null
}

const clearStorage = () => {
  if (import.meta.client) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  initialized: boolean
  loading: boolean
  loginError: string | null // Track login errors to prevent redirect
  errors: Record<string, string | null>
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    initialized: false,
    loading: false,
    loginError: null,
    errors: {}
  }),

  getters: {
    // Get user info
    getUserInfo: (state) => state.user,
    
    // Check authentication status
    getAuthStatus: (state) => state.isAuthenticated,
    
    // Get user role
    getUserRole: (state) => state.user?.role,
    
    // Check if user has specific role
    hasRole: (state) => (role: string | string[]) => {
      if (!state.user) return false
      
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(state.user.role)
    },
    
    // Check if user is admin
    isAdmin: (state) => {
      return state.user?.role === 'ADMIN' || state.user?.role === 'OWNER'
    },
    
    // Check if user is owner
    isOwner: (state) => {
      return state.user?.role === 'OWNER'
    },
    
    // Get user display name
    getDisplayName: (state) => {
      return state.user?.name || state.user?.email || 'User'
    },

    // Loading states
    isLoading: (state) => state.loading,

    // Get error by key
    getError: (state) => (key: string) => state.errors[key],

    // Check if has error
    hasError: (state) => (key: string) => !!state.errors[key]
  },

  actions: {
    // Set user data
    setUser(user: User) {
      this.user = user
      saveToStorage({
        user: this.user,
        isAuthenticated: this.isAuthenticated,
        initialized: this.initialized
      })
    },
    
    // Set authentication status
    setAuthenticated(status: boolean) {
      this.isAuthenticated = status
      saveToStorage({
        user: this.user,
        isAuthenticated: this.isAuthenticated,
        initialized: this.initialized
      })
    },
    
    // Set initialized status
    setInitialized(status: boolean) {
      this.initialized = status
      saveToStorage({
        user: this.user,
        isAuthenticated: this.isAuthenticated,
        initialized: this.initialized
      })
    },
    
    // Update user profile
    updateUser(updates: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...updates }
        saveToStorage({
          user: this.user,
          isAuthenticated: this.isAuthenticated,
          initialized: this.initialized
        })
      }
    },

    // Set loading state
    setLoading(loading: boolean) {
      this.loading = loading
    },

    // Set error
    setError(key: string, error: string | null) {
      this.errors[key] = error
    },

    // Clear error
    clearError(key: string) {
      this.errors[key] = null
    },

    // Clear all errors
    clearAllErrors() {
      this.errors = {}
    },
    
    // Clear authentication data
    clearAuth() {
      this.user = null
      this.isAuthenticated = false
      this.loading = false
      this.loginError = null
      this.errors = {}
      clearStorage()
    },
    
    // Reset store
    $reset() {
      this.user = null
      this.isAuthenticated = false
      this.initialized = false
      this.loading = false
      this.loginError = null
      this.errors = {}
      clearStorage()
    },

    // Load state from localStorage
    loadFromStorage() {
      const data = loadFromStorage()
      if (data) {
        this.user = data.user || null
        this.isAuthenticated = data.isAuthenticated || false
        this.initialized = data.initialized || false
        return true
      }
      return false
    }
  },

  // Persist state in localStorage
  persist: true
})