import { defineStore } from 'pinia'
import type {
  LocationWithOwner,
  LocationStatus,
  LocationMember,
  Counter,
  CreateLocationRequest,
  UpdateLocationRequest,
  AddMemberRequest,
  LoadingState,
  PaginatedResponse
} from '~/types'

interface LocationState {
  locations: LocationWithOwner[]
  currentLocation: LocationWithOwner | null
  locationStatus: Record<number, LocationStatus>
  locationCounters: Record<number, Counter[]>
  locationMembers: Record<number, LocationMember[]>
  pagination: any
  loading: LoadingState
  errors: Record<string, string | null>
}

export const useLocationStore = defineStore('location', {
  state: (): LocationState => ({
    locations: [],
    currentLocation: null,
    locationStatus: {},
    locationCounters: {},
    locationMembers: {},
    pagination: null,
    loading: {
      loading: false,
      error: null,
      lastFetch: null
    },
    errors: {}
  }),

  getters: {
    getLocationById: (state) => (id: number) => {
      return state.locations.find(location => location.id === id) || null
    },

    getLocationStatusById: (state) => (id: number) => {
      return state.locationStatus[id] || null
    },

    getLocationCountersById: (state) => (id: number) => {
      return state.locationCounters[id] || []
    },

    getLocationMembersById: (state) => (id: number) => {
      return state.locationMembers[id] || []
    },

    isLoading: (state) => state.loading.loading,

    hasError: (state) => (key: string) => {
      return state.errors[key] || null
    },

    getActiveLocations: (state) => {
      return state.locations.filter(location => location.is_active)
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

    async fetchAllLocations(options?: { page?: number; limit?: number }) {
      try {
        this.setLoading(true)
        this.clearError('fetchLocations')

        const locationApi = useLocationApi()
        const response = await locationApi.getAllLocations(options)

        if (response.ok && response.data) {
          this.locations = response.data.rows
          this.pagination = response.pagination
          return response.data
        } else {
          throw new Error(response.error || 'Failed to fetch locations')
        }
      } catch (error: any) {
        this.setError('fetchLocations', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchLocationById(id: number) {
      try {
        this.setLoading(true)
        this.clearError('fetchLocation')

        const locationApi = useLocationApi()
        const response = await locationApi.getLocationById(id)

        if (response.ok && response.data) {
          const location = response.data.location
          
          const index = this.locations.findIndex(l => l.id === id)
          if (index !== -1) {
            this.locations[index] = location
          } else {
            this.locations.push(location)
          }
          
          this.currentLocation = location
          return location
        } else {
          throw new Error(response.error || 'Failed to fetch location')
        }
      } catch (error: any) {
        this.setError('fetchLocation', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async createLocation(data: CreateLocationRequest) {
      try {
        this.setLoading(true)
        this.clearError('createLocation')

        const locationApi = useLocationApi()
        const response = await locationApi.createLocation(data)

        if (response.ok && response.data) {
          const location = response.data.location
          this.locations.push(location)
          return location
        } else {
          throw new Error(response.error || 'Failed to create location')
        }
      } catch (error: any) {
        this.setError('createLocation', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async updateLocation(id: number, data: UpdateLocationRequest) {
      try {
        this.setLoading(true)
        this.clearError('updateLocation')

        const locationApi = useLocationApi()
        const response = await locationApi.updateLocation(id, data)

        if (response.ok && response.data) {
          const updatedLocation = response.data.location
          
          const index = this.locations.findIndex(l => l.id === id)
          if (index !== -1) {
            this.locations[index] = { ...this.locations[index], ...updatedLocation }
          }
          
          if (this.currentLocation && this.currentLocation.id === id) {
            this.currentLocation = { ...this.currentLocation, ...updatedLocation }
          }
          
          return updatedLocation
        } else {
          throw new Error(response.error || 'Failed to update location')
        }
      } catch (error: any) {
        this.setError('updateLocation', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async deleteLocation(id: number) {
      try {
        this.setLoading(true)
        this.clearError('deleteLocation')

        const locationApi = useLocationApi()
        const response = await locationApi.deleteLocation(id)

        if (response.ok) {
          this.locations = this.locations.filter(l => l.id !== id)
          
          if (this.currentLocation && this.currentLocation.id === id) {
            this.currentLocation = null
          }
          
          this.clearLocationData(id)
          return response.data
        } else {
          throw new Error(response.error || 'Failed to delete location')
        }
      } catch (error: any) {
        this.setError('deleteLocation', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchLocationCounters(id: number) {
      try {
        this.setLoading(true)
        this.clearError('locationCounters')

        const locationApi = useLocationApi()
        const response = await locationApi.getLocationCounters(id)

        if (response.ok && response.data) {
          this.locationCounters[id] = response.data.counters
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

    async fetchLocationStatus(id: number, date?: string) {
      try {
        this.setLoading(true)
        this.clearError('locationStatus')

        const locationApi = useLocationApi()
        const response = await locationApi.getLocationStatus(id, date)

        if (response.ok && response.data) {
          this.locationStatus[id] = response.data.status
          return response.data.status
        } else {
          throw new Error(response.error || 'Failed to fetch location status')
        }
      } catch (error: any) {
        this.setError('locationStatus', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async addLocationMember(id: number, data: AddMemberRequest) {
      try {
        this.setLoading(true)
        this.clearError('addMember')

        const locationApi = useLocationApi()
        const response = await locationApi.addLocationMember(id, data)

        if (response.ok && response.data) {
          const member = response.data.member
          
          if (!this.locationMembers[id]) {
            this.locationMembers[id] = []
          }
          
          this.locationMembers[id].push(member)
          return member
        } else {
          throw new Error(response.error || 'Failed to add location member')
        }
      } catch (error: any) {
        this.setError('addMember', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async removeLocationMember(id: number, userId: number) {
      try {
        this.setLoading(true)
        this.clearError('removeMember')

        const locationApi = useLocationApi()
        const response = await locationApi.removeLocationMember(id, userId)

        if (response.ok) {
          if (this.locationMembers[id]) {
            this.locationMembers[id] = this.locationMembers[id].filter(m => m.user_id !== userId)
          }
          return response.data
        } else {
          throw new Error(response.error || 'Failed to remove location member')
        }
      } catch (error: any) {
        this.setError('removeMember', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchLocationMembers(id: number) {
      try {
        this.setLoading(true)
        this.clearError('locationMembers')

        const locationApi = useLocationApi()
        const response = await locationApi.getLocationMembers(id)

        if (response.ok && response.data) {
          this.locationMembers[id] = response.data.members
          return response.data.members
        } else {
          throw new Error(response.error || 'Failed to fetch location members')
        }
      } catch (error: any) {
        this.setError('locationMembers', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    setCurrentLocation(location: LocationWithOwner | null) {
      this.currentLocation = location
    },

    clearLocationData(id: number) {
      delete this.locationStatus[id]
      delete this.locationCounters[id]
      delete this.locationMembers[id]
    },

    reset() {
      this.locations = []
      this.currentLocation = null
      this.locationStatus = {}
      this.locationCounters = {}
      this.locationMembers = {}
      this.pagination = null
      this.loading = { loading: false, error: null, lastFetch: null }
      this.errors = {}
    }
  }
})