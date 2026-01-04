/* FILE: src/stores/business.ts */
import { defineStore } from 'pinia'
import type {
  ServiceLocation,
  DailySummary,
  LoadingState
} from '~/types'

// Owner Dashboard Types
export interface OwnerDashboard {
  date: string
  locationsCount: number
  activeLocationsCount: number
  peakHour?: string
  totals: {
    totalIssued: number
    totalDone: number
    totalHold: number
    totalCancel: number
    avgServiceSeconds: number
    avgWaitSeconds?: number
    completionRate: number
  }
  locations: Array<{
    location: {
      id: number
      name: string
      city?: string
      isActive: boolean
    }
    summary: {
      total_issued: number
      total_done: number
      total_hold: number
      total_cancel: number
      avg_service_seconds: number
      avg_wait_seconds?: number
    }
  }>
}

export interface LocationAnalytics {
  locationId: number
  locationName: string
  period: {
    startDate: string
    endDate: string
  }
  aggregated: {
    totalIssued: number
    totalDone: number
    totalHold: number
    totalCancel: number
    avgServiceSeconds: number
  }
  daily: DailySummary[]
}

export interface BusinessState {
  businesses: ServiceLocation[]
  selectedBusinessId: number | null
  currentBusiness: ServiceLocation | null
  ownerDashboard: OwnerDashboard | null
  locationAnalytics: Record<number, LocationAnalytics>
  loading: LoadingState
  errors: Record<string, string | null>
}

export const useBusinessStore = defineStore('business', {
  state: (): BusinessState => ({
    businesses: [],
    selectedBusinessId: null,
    currentBusiness: null,
    ownerDashboard: null,
    locationAnalytics: {},
    loading: {
      loading: false,
      error: null,
      lastFetch: null
    },
    errors: {}
  }),

  getters: {
    // Get all businesses
    getBusinesses: (state) => state.businesses,

    // Get selected business ID
    getSelectedBusinessId: (state) => state.selectedBusinessId,

    // Get current/selected business
    getCurrentBusiness: (state) => {
      if (state.selectedBusinessId) {
        return state.businesses.find(b => b.id === state.selectedBusinessId) || null
      }
      return state.currentBusiness
    },

    // Get business by ID
    getBusinessById: (state) => (id: number) => {
      return state.businesses.find(b => b.id === id) || null
    },

    // Get active businesses only
    getActiveBusinesses: (state) => {
      return state.businesses.filter(b => b.is_active)
    },

    // Get owner dashboard data
    getOwnerDashboard: (state) => state.ownerDashboard,

    // Get location analytics by ID
    getLocationAnalyticsById: (state) => (locationId: number) => {
      return state.locationAnalytics[locationId] || null
    },

    // Loading state
    isLoading: (state) => state.loading.loading,

    // Get error by key
    hasError: (state) => (key: string) => state.errors[key] || null,

    // Check if has any businesses
    hasBusinesses: (state) => state.businesses.length > 0,

    // Get businesses count
    businessesCount: (state) => state.businesses.length
  },

  actions: {
    // Set loading state
    setLoading(loading: boolean, error: string | null = null) {
      this.loading = {
        loading,
        error,
        lastFetch: loading ? null : new Date()
      }
    },

    // Set error
    setError(key: string, error: string | null) {
      this.errors[key] = error
    },

    // Clear error
    clearError(key: string) {
      this.errors[key] = null
    },

    // Set businesses
    setBusinesses(businesses: ServiceLocation[]) {
      this.businesses = businesses
      
      // Auto-select first business if none selected
      if (businesses.length > 0 && !this.selectedBusinessId) {
        this.selectedBusinessId = businesses[0].id
        this.currentBusiness = businesses[0]
      }
    },

    // Set selected business
    setSelectedBusiness(businessId: number) {
      this.selectedBusinessId = businessId
      this.currentBusiness = this.businesses.find(b => b.id === businessId) || null
    },

    // Set owner dashboard
    setOwnerDashboard(dashboard: OwnerDashboard) {
      this.ownerDashboard = dashboard
    },

    // Set location analytics
    setLocationAnalytics(locationId: number, analytics: LocationAnalytics) {
      this.locationAnalytics[locationId] = analytics
    },

    // Add new business
    addBusiness(business: ServiceLocation) {
      this.businesses.push(business)
      
      // Select if first business
      if (this.businesses.length === 1) {
        this.selectedBusinessId = business.id
        this.currentBusiness = business
      }
    },

    // Update business
    updateBusiness(id: number, updates: Partial<ServiceLocation>) {
      const index = this.businesses.findIndex(b => b.id === id)
      if (index !== -1) {
        this.businesses[index] = { ...this.businesses[index], ...updates }
        
        // Update current business if it's the same
        if (this.selectedBusinessId === id) {
          this.currentBusiness = this.businesses[index]
        }
      }
    },

    // Remove business
    removeBusiness(id: number) {
      this.businesses = this.businesses.filter(b => b.id !== id)
      
      // Reset selection if removed business was selected
      if (this.selectedBusinessId === id) {
        this.selectedBusinessId = this.businesses.length > 0 ? this.businesses[0].id : null
        this.currentBusiness = this.businesses.length > 0 ? this.businesses[0] : null
      }
      
      // Clear analytics for removed location
      delete this.locationAnalytics[id]
    },

    // Clear location analytics
    clearLocationAnalytics(locationId: number) {
      delete this.locationAnalytics[locationId]
    },

    // Reset store
    reset() {
      this.businesses = []
      this.selectedBusinessId = null
      this.currentBusiness = null
      this.ownerDashboard = null
      this.locationAnalytics = {}
      this.loading = { loading: false, error: null, lastFetch: null }
      this.errors = {}
    }
  }
})
