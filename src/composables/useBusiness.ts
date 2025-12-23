/* FILE: src/composables/useBusiness.ts */
import type { ServiceLocation } from '~/types'
import type { CreateLocationRequest, UpdateLocationRequest } from '~/composables/useOwnerApi'

export const useBusiness = () => {
  const businessStore = useBusinessStore()
  const ownerApi = useOwnerApi()

  /**
   * Fetch all businesses/locations owned by current user
   */
  const fetchMyBusinesses = async () => {
    try {
      businessStore.setLoading(true)
      businessStore.clearError('fetchBusinesses')

      const response = await ownerApi.getMyLocations()

      if (response.ok && response.data) {
        businessStore.setBusinesses(response.data.locations)
        return response.data.locations
      } else {
        throw new Error(response.error || 'Failed to fetch businesses')
      }
    } catch (error: any) {
      businessStore.setError('fetchBusinesses', error.message)
      throw error
    } finally {
      businessStore.setLoading(false)
    }
  }

  /**
   * Fetch a specific business by ID
   */
  const fetchBusinessById = async (id: number) => {
    try {
      businessStore.setLoading(true)
      businessStore.clearError('fetchBusiness')

      const response = await ownerApi.getLocationById(id)

      if (response.ok && response.data) {
        const location = response.data.location
        businessStore.updateBusiness(id, location)
        return location
      } else {
        throw new Error(response.error || 'Failed to fetch business')
      }
    } catch (error: any) {
      businessStore.setError('fetchBusiness', error.message)
      throw error
    } finally {
      businessStore.setLoading(false)
    }
  }

  /**
   * Create a new business/location
   */
  const createBusiness = async (data: CreateLocationRequest) => {
    try {
      businessStore.setLoading(true)
      businessStore.clearError('createBusiness')

      const response = await ownerApi.createLocation(data)

      if (response.ok && response.data) {
        const location = response.data.location
        businessStore.addBusiness(location)
        return location
      } else {
        throw new Error(response.error || 'Failed to create business')
      }
    } catch (error: any) {
      businessStore.setError('createBusiness', error.message)
      throw error
    } finally {
      businessStore.setLoading(false)
    }
  }

  /**
   * Update an existing business/location
   */
  const updateBusiness = async (id: number, data: UpdateLocationRequest) => {
    try {
      businessStore.setLoading(true)
      businessStore.clearError('updateBusiness')

      const response = await ownerApi.updateLocation(id, data)

      if (response.ok && response.data) {
        const location = response.data.location
        businessStore.updateBusiness(id, location)
        return location
      } else {
        throw new Error(response.error || 'Failed to update business')
      }
    } catch (error: any) {
      businessStore.setError('updateBusiness', error.message)
      throw error
    } finally {
      businessStore.setLoading(false)
    }
  }

  /**
   * Delete a business/location
   */
  const deleteBusiness = async (id: number) => {
    try {
      businessStore.setLoading(true)
      businessStore.clearError('deleteBusiness')

      const response = await ownerApi.deleteLocation(id)

      if (response.ok) {
        businessStore.removeBusiness(id)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to delete business')
      }
    } catch (error: any) {
      businessStore.setError('deleteBusiness', error.message)
      throw error
    } finally {
      businessStore.setLoading(false)
    }
  }

  /**
   * Fetch owner dashboard data
   */
  const fetchOwnerDashboard = async (date?: string) => {
    try {
      businessStore.setLoading(true)
      businessStore.clearError('fetchDashboard')

      const response = await ownerApi.getOwnerDashboard(date)

      if (response.ok && response.data) {
        businessStore.setOwnerDashboard(response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard')
      }
    } catch (error: any) {
      businessStore.setError('fetchDashboard', error.message)
      throw error
    } finally {
      businessStore.setLoading(false)
    }
  }

  /**
   * Fetch location analytics
   */
  const fetchLocationAnalytics = async (locationId: number, startDate: string, endDate: string) => {
    try {
      businessStore.setLoading(true)
      businessStore.clearError('fetchAnalytics')

      const response = await ownerApi.getLocationAnalytics(locationId, startDate, endDate)

      if (response.ok && response.data) {
        businessStore.setLocationAnalytics(locationId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch analytics')
      }
    } catch (error: any) {
      businessStore.setError('fetchAnalytics', error.message)
      throw error
    } finally {
      businessStore.setLoading(false)
    }
  }

  /**
   * Set selected business
   */
  const selectBusiness = (businessId: number) => {
    businessStore.setSelectedBusiness(businessId)
  }

  /**
   * Initialize businesses on mount (fetch if needed)
   */
  const initializeBusinesses = async () => {
    if (!businessStore.hasBusinesses) {
      await fetchMyBusinesses()
    }
  }

  return {
    // Methods
    fetchMyBusinesses,
    fetchBusinessById,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    fetchOwnerDashboard,
    fetchLocationAnalytics,
    selectBusiness,
    initializeBusinesses,

    // Computed state from store
    businesses: computed(() => businessStore.getBusinesses),
    selectedBusiness: computed(() => businessStore.getSelectedBusinessId),
    currentBusiness: computed(() => businessStore.getCurrentBusiness),
    ownerDashboard: computed(() => businessStore.getOwnerDashboard),
    isLoading: computed(() => businessStore.isLoading),
    hasBusinesses: computed(() => businessStore.hasBusinesses),

    // Getter functions
    getBusinessById: businessStore.getBusinessById,
    getLocationAnalytics: businessStore.getLocationAnalyticsById
  }
}
