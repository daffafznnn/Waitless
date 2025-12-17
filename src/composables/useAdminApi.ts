import type {
  ApiResponse,
  CreateCounterRequest,
  UpdateCounterRequest,
  Counter,
  CounterWithStatus,
  CounterQueueStatus,
  ActivityLog,
  DailySummary,
  DashboardStats,
  PaginatedResponse
} from '~/types'

export const useAdminApi = () => {
  const { get, post, put, delete: del } = useApi()

  const createCounter = async (data: CreateCounterRequest): Promise<ApiResponse<{ counter: Counter }>> => {
    return await post('/admin/counters', data)
  }

  const updateCounter = async (counterId: number, data: UpdateCounterRequest): Promise<ApiResponse<{ counter: Counter }>> => {
    return await put(`/admin/counters/${counterId}`, data)
  }

  const deleteCounter = async (counterId: number): Promise<ApiResponse<{ message: string }>> => {
    return await del(`/admin/counters/${counterId}`)
  }

  const getLocationCounters = async (locationId: number): Promise<ApiResponse<{ counters: Counter[] }>> => {
    return await get(`/admin/locations/${locationId}/counters`)
  }

  const getCountersWithStatus = async (
    locationId: number,
    date?: string
  ): Promise<ApiResponse<{ counters: CounterWithStatus[] }>> => {
    const params = date ? { date } : {}
    return await get(`/admin/locations/${locationId}/counters/status`, { params })
  }

  const getCounterQueueStatus = async (
    counterId: number,
    date?: string
  ): Promise<ApiResponse<{ status: CounterQueueStatus }>> => {
    const params = date ? { date } : {}
    return await get(`/admin/counters/${counterId}/queue`, { params })
  }

  const getLocationActivity = async (
    locationId: number,
    options?: {
      date?: string
      page?: number
      limit?: number
    }
  ): Promise<ApiResponse<{ activity: ActivityLog[]; pagination: any }>> => {
    const params = {
      page: options?.page || 1,
      limit: options?.limit || 50,
      ...(options?.date && { date: options.date })
    }
    return await get(`/admin/locations/${locationId}/activity`, { params })
  }

  const getCounterActivity = async (
    counterId: number,
    options?: {
      date?: string
      page?: number
      limit?: number
    }
  ): Promise<ApiResponse<{ activity: ActivityLog[]; pagination: any }>> => {
    const params = {
      page: options?.page || 1,
      limit: options?.limit || 50,
      ...(options?.date && { date: options.date })
    }
    return await get(`/admin/counters/${counterId}/activity`, { params })
  }

  const getDailySummary = async (
    locationId: number,
    date?: string
  ): Promise<ApiResponse<{ summary: DailySummary }>> => {
    const params = date ? { date } : {}
    return await get(`/admin/locations/${locationId}/summary`, { params })
  }

  const getDashboardStats = async (
    locationId: number,
    date?: string
  ): Promise<ApiResponse<{ stats: DashboardStats }>> => {
    const params = date ? { date } : {}
    return await get(`/admin/locations/${locationId}/dashboard`, { params })
  }

  const getGeneralDashboardStats = async (
    date?: string
  ): Promise<ApiResponse<DashboardStats>> => {
    const params = date ? { date } : {}
    return await get('/admin/dashboard/stats', { params })
  }

  const getActiveQueues = async (): Promise<ApiResponse<any[]>> => {
    return await get('/admin/dashboard/active-queues')
  }

  const getAllAccessibleCounters = async (): Promise<ApiResponse<{ counters: Counter[] }>> => {
    return await get('/admin/counters')
  }

  return {
    createCounter,
    updateCounter,
    deleteCounter,
    getLocationCounters,
    getCountersWithStatus,
    getCounterQueueStatus,
    getLocationActivity,
    getCounterActivity,
    getDailySummary,
    getDashboardStats,
    getGeneralDashboardStats,
    getActiveQueues,
    getAllAccessibleCounters
  }
}