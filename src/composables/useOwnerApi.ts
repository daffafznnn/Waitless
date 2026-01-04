/* FILE: src/composables/useOwnerApi.ts */
import type {
  ApiResponse,
  ServiceLocation,
  Counter
} from '~/types'
import type { OwnerDashboard, LocationAnalytics } from '~/stores/business'

// Request types for owner operations




export interface StaffMember {
  id: number
  name: string
  email: string
  phone?: string
  role: string
  is_active: boolean
  created_at: string
  locations: Array<{ id: number; name: string }>
}

export interface InviteStaffRequest {
  email: string
  name: string
  locationId: number
  role: string
  password?: string
}

export interface UpdateStaffRequest {
  name?: string
  role?: string
  locationId?: number
  is_active?: boolean
}

export const useOwnerApi = () => {
  const { get, post, put, patch, delete: del } = useApi()

  /**
   * Get all locations owned by the current user
   */
  const getMyLocations = async (): Promise<ApiResponse<{ locations: ServiceLocation[] }>> => {
    return await get('/owner/locations')
  }

  /**
   * Get a specific location by ID (must be owned by user)
   */
  const getLocationById = async (locationId: number): Promise<ApiResponse<{ location: ServiceLocation }>> => {
    return await get(`/owner/locations/${locationId}`)
  }

  /**
   * Create a new location
   */
  const createLocation = async (data: CreateLocationRequest): Promise<ApiResponse<{ location: ServiceLocation }>> => {
    return await post('/owner/locations', data)
  }

  /**
   * Update an existing location
   */
  const updateLocation = async (
    locationId: number,
    data: UpdateLocationRequest
  ): Promise<ApiResponse<{ location: ServiceLocation }>> => {
    return await put(`/owner/locations/${locationId}`, data)
  }

  /**
   * Delete a location
   */
  const deleteLocation = async (locationId: number): Promise<ApiResponse<{ message: string }>> => {
    return await del(`/owner/locations/${locationId}`)
  }

  /**
   * Get owner dashboard data (aggregated stats for all locations)
   */
  const getOwnerDashboard = async (date?: string): Promise<ApiResponse<OwnerDashboard>> => {
    const params = date ? { date } : {}
    return await get('/owner/dashboard', { params })
  }

  /**
   * Get location analytics for a specific date range
   */
  const getLocationAnalytics = async (
    locationId: number,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<LocationAnalytics>> => {
    return await get(`/owner/locations/${locationId}/analytics`, {
      params: { startDate, endDate }
    })
  }

  /**
   * Generate location report
   */
  const generateLocationReport = async (
    locationId: number,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<any>> => {
    return await get(`/owner/locations/${locationId}/report`, {
      params: { startDate, endDate }
    })
  }

  /**
   * Get top performing locations
   */
  const getTopPerformingLocations = async (
    date?: string,
    limit: number = 5
  ): Promise<ApiResponse<any[]>> => {
    const params: Record<string, any> = { limit }
    if (date) params.date = date
    return await get('/owner/locations/top-performing', { params })
  }

  // ========== COUNTER MANAGEMENT ==========

  /**
   * Get all counters for a location
   */
  const getLocationCounters = async (locationId: number): Promise<ApiResponse<{ counters: Counter[] }>> => {
    return await get(`/owner/locations/${locationId}/counters`)
  }

  /**
   * Create a new counter in a location
   */
  const createCounter = async (
    locationId: number,
    data: CreateCounterRequest
  ): Promise<ApiResponse<{ counter: Counter }>> => {
    return await post(`/owner/locations/${locationId}/counters`, data)
  }

  /**
   * Update a counter
   */
  const updateCounter = async (
    counterId: number,
    data: UpdateCounterRequest
  ): Promise<ApiResponse<{ counter: Counter }>> => {
    return await put(`/owner/counters/${counterId}`, data)
  }

  /**
   * Delete a counter
   */
  const deleteCounter = async (counterId: number): Promise<ApiResponse<{ message: string }>> => {
    return await del(`/owner/counters/${counterId}`)
  }

  // ========== STAFF MANAGEMENT ==========

  /**
   * Get all staff for owner's locations
   */
  const getStaffList = async (): Promise<ApiResponse<{ staff: StaffMember[]; count: number }>> => {
    return await get('/owner/staff')
  }

  /**
   * Invite/create a new staff member
   */
  const inviteStaff = async (data: InviteStaffRequest): Promise<ApiResponse<{ staff: StaffMember }>> => {
    return await post('/owner/staff', data)
  }

  /**
   * Update staff member details
   */
  const updateStaff = async (
    staffId: number,
    data: UpdateStaffRequest
  ): Promise<ApiResponse<{ staff: StaffMember }>> => {
    return await put(`/owner/staff/${staffId}`, data)
  }

  /**
   * Toggle staff active status
   */
  const toggleStaffStatus = async (staffId: number): Promise<ApiResponse<{ staff: StaffMember }>> => {
    return await patch(`/owner/staff/${staffId}/status`, {})
  }

  /**
   * Remove staff member
   */
  const removeStaff = async (staffId: number): Promise<ApiResponse<{ message: string }>> => {
    return await del(`/owner/staff/${staffId}`)
  }

  /**
   * Get owner's tickets for reports (all locations)
   */
  const getOwnerTickets = async (
    startDate: string,
    endDate: string,
    locationId?: number,
    status?: string
  ): Promise<ApiResponse<{ tickets: any[]; counters: any[]; locations: any[] }>> => {
    const params: Record<string, any> = { startDate, endDate }
    if (locationId) params.locationId = locationId
    if (status) params.status = status
    return await get('/owner/tickets', { params })
  }

  return {
    // Location management
    getMyLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,

    // Dashboard & Analytics
    getOwnerDashboard,
    getLocationAnalytics,
    generateLocationReport,
    getTopPerformingLocations,
    getOwnerTickets,

    // Counter management
    getLocationCounters,
    createCounter,
    updateCounter,
    deleteCounter,

    // Staff management
    getStaffList,
    inviteStaff,
    updateStaff,
    toggleStaffStatus,
    removeStaff
  }
}
