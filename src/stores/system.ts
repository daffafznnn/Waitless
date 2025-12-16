import { defineStore } from 'pinia'
import type {
  SystemStatus,
  HealthCheck,
  LoadingState
} from '~/types'

interface SystemState {
  systemStatus: SystemStatus | null
  healthCheck: HealthCheck | null
  loading: LoadingState
  errors: Record<string, string | null>
}

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    systemStatus: null,
    healthCheck: null,
    loading: {
      loading: false,
      error: null,
      lastFetch: null
    },
    errors: {}
  }),

  getters: {
    isSystemHealthy: (state) => {
      return state.healthCheck?.ok === true && state.systemStatus?.server === 'running'
    },

    isDatabaseConnected: (state) => {
      return state.systemStatus?.database === 'connected'
    },

    areJobsRunning: (state) => {
      const jobs = state.systemStatus?.jobs
      return jobs ? Object.values(jobs).every(status => status === true) : false
    },

    isLoading: (state) => state.loading.loading,

    hasError: (state) => (key: string) => {
      return state.errors[key] || null
    },

    getLastUpdateTime: (state) => {
      return state.loading.lastFetch
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

    async checkHealth() {
      try {
        this.setLoading(true)
        this.clearError('healthCheck')

        const systemApi = useSystemApi()
        const healthCheck = await systemApi.healthCheck()

        this.healthCheck = healthCheck
        return healthCheck
      } catch (error: any) {
        this.setError('healthCheck', error.message)
        this.healthCheck = {
          ok: false,
          message: 'Health check failed',
          timestamp: new Date().toISOString(),
          version: 'unknown'
        }
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchSystemStatus() {
      try {
        this.setLoading(true)
        this.clearError('systemStatus')

        const systemApi = useSystemApi()
        const response = await systemApi.getSystemStatus()

        if (response.ok && response.data) {
          this.systemStatus = response.data
          return response.data
        } else {
          throw new Error(response.error || 'Failed to fetch system status')
        }
      } catch (error: any) {
        this.setError('systemStatus', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async performFullSystemCheck() {
      try {
        this.setLoading(true)
        this.clearError('fullSystemCheck')

        const [healthCheck, systemStatus] = await Promise.allSettled([
          this.checkHealth(),
          this.fetchSystemStatus()
        ])

        const results = {
          healthCheck: healthCheck.status === 'fulfilled' ? healthCheck.value : null,
          systemStatus: systemStatus.status === 'fulfilled' ? systemStatus.value : null,
          errors: []
        }

        if (healthCheck.status === 'rejected') {
          results.errors.push(`Health check failed: ${healthCheck.reason.message}`)
        }

        if (systemStatus.status === 'rejected') {
          results.errors.push(`System status failed: ${systemStatus.reason.message}`)
        }

        return results
      } catch (error: any) {
        this.setError('fullSystemCheck', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async monitorSystem(intervalMs: number = 30000) {
      const monitor = async () => {
        try {
          await this.performFullSystemCheck()
        } catch (error) {
          console.warn('System monitoring check failed:', error)
        }
      }

      await monitor()
      
      return setInterval(monitor, intervalMs)
    },

    reset() {
      this.systemStatus = null
      this.healthCheck = null
      this.loading = { loading: false, error: null, lastFetch: null }
      this.errors = {}
    }
  }
})