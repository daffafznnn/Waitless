import { defineStore } from 'pinia'
import type {
  Counter,
  CounterWithStatus,
  CounterQueueStatus,
  ActivityLog,
  DailySummary,
  DashboardStats,
  CreateCounterRequest,
  UpdateCounterRequest,
  LoadingState
} from '~/types'

interface AdminState {
  counters: Record<number, Counter[]>
  countersWithStatus: Record<number, CounterWithStatus[]>
  queueStatuses: Record<number, CounterQueueStatus>
  activities: Record<number, ActivityLog[]>
  dailySummaries: Record<number, DailySummary>
  dashboardStats: Record<number, DashboardStats>
  generalDashboardStats: DashboardStats | null
  activeQueues: any[]
  loading: LoadingState
  errors: Record<string, string | null>
}

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    counters: {},
    countersWithStatus: {},
    queueStatuses: {},
    activities: {},
    dailySummaries: {},
    dashboardStats: {},
    generalDashboardStats: null,
    activeQueues: [],
    loading: {
      loading: false,
      error: null,
      lastFetch: null
    },
    errors: {}
  }),

  getters: {
    getCountersByLocation: (state) => (locationId: number) => {
      return state.counters[locationId] || []
    },

    getCountersWithStatusByLocation: (state) => (locationId: number) => {
      return state.countersWithStatus[locationId] || []
    },

    getQueueStatusByCounter: (state) => (counterId: number) => {
      return state.queueStatuses[counterId] || null
    },

    getActivitiesByLocation: (state) => (locationId: number) => {
      return state.activities[locationId] || []
    },

    getDailySummaryByLocation: (state) => (locationId: number) => {
      return state.dailySummaries[locationId] || null
    },

    getDashboardStatsByLocation: (state) => (locationId: number) => {
      return state.dashboardStats[locationId] || null
    },

    getGeneralDashboardStats: (state) => {
      return state.generalDashboardStats
    },

    getActiveQueues: (state) => {
      return state.activeQueues
    },

    isLoading: (state) => state.loading.loading,

    hasError: (state) => (key: string) => {
      return state.errors[key] || null
    }
  },

  actions: {
    setLoading(loading: boolean, error: string | null = null) {
      this.loading = {
        loading,
        error,
        lastFetch: loading ? null : new Date()
      }
    },

    setError(key: string, error: string | null) {
      this.errors[key] = error
    },

    clearError(key: string) {
      this.errors[key] = null
    },

    async createCounter(data: CreateCounterRequest) {
      try {
        this.setLoading(true)
        this.clearError('createCounter')

        const adminApi = useAdminApi()
        const response = await adminApi.createCounter(data)

        if (response.ok && response.data) {
          const counter = response.data.counter
          const locationId = data.locationId

          if (!this.counters[locationId]) {
            this.counters[locationId] = []
          }
          
          this.counters[locationId].push(counter)
          return counter
        } else {
          throw new Error(response.error || 'Failed to create counter')
        }
      } catch (error: any) {
        this.setError('createCounter', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async updateCounter(counterId: number, data: UpdateCounterRequest) {
      try {
        this.setLoading(true)
        this.clearError('updateCounter')

        const adminApi = useAdminApi()
        const response = await adminApi.updateCounter(counterId, data)

        if (response.ok && response.data) {
          const updatedCounter = response.data.counter
          
          Object.keys(this.counters).forEach(locationId => {
            const index = this.counters[parseInt(locationId)].findIndex(c => c.id === counterId)
            if (index !== -1) {
              this.counters[parseInt(locationId)][index] = updatedCounter
            }
          })

          return updatedCounter
        } else {
          throw new Error(response.error || 'Failed to update counter')
        }
      } catch (error: any) {
        this.setError('updateCounter', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async deleteCounter(counterId: number) {
      try {
        this.setLoading(true)
        this.clearError('deleteCounter')

        const adminApi = useAdminApi()
        const response = await adminApi.deleteCounter(counterId)

        if (response.ok) {
          Object.keys(this.counters).forEach(locationId => {
            this.counters[parseInt(locationId)] = this.counters[parseInt(locationId)].filter(c => c.id !== counterId)
          })

          Object.keys(this.countersWithStatus).forEach(locationId => {
            this.countersWithStatus[parseInt(locationId)] = this.countersWithStatus[parseInt(locationId)].filter(c => c.id !== counterId)
          })

          delete this.queueStatuses[counterId]
          
          return response.data
        } else {
          throw new Error(response.error || 'Failed to delete counter')
        }
      } catch (error: any) {
        this.setError('deleteCounter', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchLocationCounters(locationId: number) {
      try {
        this.setLoading(true)
        this.clearError('locationCounters')

        const adminApi = useAdminApi()
        const response = await adminApi.getLocationCounters(locationId)

        if (response.ok && response.data) {
          this.counters[locationId] = response.data.counters
          return response.data.counters
        } else {
          throw new Error(response.error || 'Failed to fetch location counters')
        }
      } catch (error: any) {
        this.setError('locationCounters', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchCountersWithStatus(locationId: number, date?: string) {
      try {
        this.setLoading(true)
        this.clearError('countersWithStatus')

        const adminApi = useAdminApi()
        const response = await adminApi.getCountersWithStatus(locationId, date)

        if (response.ok && response.data) {
          this.countersWithStatus[locationId] = response.data.counters
          return response.data.counters
        } else {
          throw new Error(response.error || 'Failed to fetch counters with status')
        }
      } catch (error: any) {
        this.setError('countersWithStatus', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchCounterQueueStatus(counterId: number, date?: string) {
      try {
        this.setLoading(true)
        this.clearError('counterQueueStatus')

        const adminApi = useAdminApi()
        const response = await adminApi.getCounterQueueStatus(counterId, date)

        if (response.ok && response.data) {
          this.queueStatuses[counterId] = response.data.status
          return response.data.status
        } else {
          throw new Error(response.error || 'Failed to fetch counter queue status')
        }
      } catch (error: any) {
        this.setError('counterQueueStatus', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchLocationActivity(locationId: number, options?: { date?: string; page?: number; limit?: number }) {
      try {
        this.setLoading(true)
        this.clearError('locationActivity')

        const adminApi = useAdminApi()
        const response = await adminApi.getLocationActivity(locationId, options)

        if (response.ok && response.data) {
          this.activities[locationId] = response.data.activity
          return response.data
        } else {
          throw new Error(response.error || 'Failed to fetch location activity')
        }
      } catch (error: any) {
        this.setError('locationActivity', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchCounterActivity(counterId: number, options?: { date?: string; page?: number; limit?: number }) {
      try {
        this.setLoading(true)
        this.clearError('counterActivity')

        const adminApi = useAdminApi()
        const response = await adminApi.getCounterActivity(counterId, options)

        if (response.ok && response.data) {
          return response.data
        } else {
          throw new Error(response.error || 'Failed to fetch counter activity')
        }
      } catch (error: any) {
        this.setError('counterActivity', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchDailySummary(locationId: number, date?: string) {
      try {
        this.setLoading(true)
        this.clearError('dailySummary')

        const adminApi = useAdminApi()
        const response = await adminApi.getDailySummary(locationId, date)

        if (response.ok && response.data) {
          this.dailySummaries[locationId] = response.data.summary
          return response.data.summary
        } else {
          throw new Error(response.error || 'Failed to fetch daily summary')
        }
      } catch (error: any) {
        this.setError('dailySummary', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchDashboardStats(locationId: number, date?: string) {
      try {
        this.setLoading(true)
        this.clearError('dashboardStats')

        const adminApi = useAdminApi()
        const response = await adminApi.getDashboardStats(locationId, date)

        if (response.ok && response.data) {
          this.dashboardStats[locationId] = response.data.stats
          return response.data.stats
        } else {
          throw new Error(response.error || 'Failed to fetch dashboard stats')
        }
      } catch (error: any) {
        this.setError('dashboardStats', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchGeneralDashboardStats(date?: string) {
      try {
        this.setLoading(true)
        this.clearError('generalDashboardStats')

        const adminApi = useAdminApi()
        const response = await adminApi.getGeneralDashboardStats(date)

        if (response.ok && response.data) {
          this.generalDashboardStats = response.data
          return response.data
        } else {
          throw new Error(response.error || 'Failed to fetch general dashboard stats')
        }
      } catch (error: any) {
        this.setError('generalDashboardStats', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchActiveQueues() {
      try {
        this.setLoading(true)
        this.clearError('activeQueues')

        const adminApi = useAdminApi()
        const response = await adminApi.getActiveQueues()

        if (response.ok && response.data) {
          // Also fetch locations to ensure location names are available
          const locationStore = useLocationStore()
          await locationStore.fetchAllLocations()
          
          this.activeQueues = response.data
          return response.data
        } else {
          throw new Error(response.error || 'Failed to fetch active queues')
        }
      } catch (error: any) {
        this.setError('activeQueues', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchAllAccessibleCounters() {
      try {
        this.setLoading(true)
        this.clearError('allAccessibleCounters')

        const adminApi = useAdminApi()
        const response = await adminApi.getAllAccessibleCounters()

        if (response.ok && response.data) {
          // Also fetch locations to ensure location names are available
          const locationStore = useLocationStore()
          await locationStore.fetchAllLocations()
          
          return response.data.counters
        } else {
          throw new Error(response.error || 'Failed to fetch accessible counters')
        }
      } catch (error: any) {
        this.setError('allAccessibleCounters', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    clearLocationData(locationId: number) {
      delete this.counters[locationId]
      delete this.countersWithStatus[locationId]
      delete this.activities[locationId]
      delete this.dailySummaries[locationId]
      delete this.dashboardStats[locationId]
    },

    clearCounterData(counterId: number) {
      delete this.queueStatuses[counterId]
    },

    reset() {
      this.counters = {}
      this.countersWithStatus = {}
      this.queueStatuses = {}
      this.activities = {}
      this.dailySummaries = {}
      this.dashboardStats = {}
      this.generalDashboardStats = null
      this.activeQueues = []
      this.loading = { loading: false, error: null, lastFetch: null }
      this.errors = {}
    }
  }
})