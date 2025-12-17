import type {
  ApiResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationWithOwner,
  LocationStatus,
  LocationMember,
  AddMemberRequest,
  Counter,
  PaginatedResponse
} from '~/types'

export const useLocationApi = () => {
  const { get, post, put, delete: del } = useApi()

  const getAllLocations = async (options?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<LocationWithOwner>>> => {
    const params = {
      page: options?.page || 1,
      limit: options?.limit || 20
    }
    return await get('/locations', { params })
  }

  const getLocationById = async (id: number): Promise<ApiResponse<{ location: LocationWithOwner }>> => {
    return await get(`/locations/${id}`)
  }

  const createLocation = async (data: CreateLocationRequest): Promise<ApiResponse<{ location: LocationWithOwner }>> => {
    return await post('/locations', data)
  }

  const updateLocation = async (id: number, data: UpdateLocationRequest): Promise<ApiResponse<{ location: LocationWithOwner }>> => {
    return await put(`/locations/${id}`, data)
  }

  const deleteLocation = async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return await del(`/locations/${id}`)
  }

  const getLocationCounters = async (id: number): Promise<ApiResponse<{ counters: Counter[] }>> => {
    return await get(`/locations/${id}/counters`)
  }

  const getLocationStatus = async (
    id: number,
    date?: string
  ): Promise<ApiResponse<{ status: LocationStatus }>> => {
    const params = date ? { date } : {}
    return await get(`/locations/${id}/status`, { params })
  }

  const addLocationMember = async (
    id: number,
    data: AddMemberRequest
  ): Promise<ApiResponse<{ member: LocationMember }>> => {
    return await post(`/locations/${id}/members`, data)
  }

  const removeLocationMember = async (
    id: number,
    userId: number
  ): Promise<ApiResponse<{ message: string }>> => {
    return await del(`/locations/${id}/members/${userId}`)
  }

  const getLocationMembers = async (id: number): Promise<ApiResponse<{ members: LocationMember[] }>> => {
    return await get(`/locations/${id}/members`)
  }

  return {
    getAllLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    getLocationCounters,
    getLocationStatus,
    addLocationMember,
    removeLocationMember,
    getLocationMembers
  }
}