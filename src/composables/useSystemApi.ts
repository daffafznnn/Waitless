import type {
  ApiResponse,
  SystemStatus,
  HealthCheck
} from '~/types'

export const useSystemApi = () => {
  const { get } = useApi()

  const healthCheck = async (): Promise<HealthCheck> => {
    try {
      const response = await fetch('/health')
      return await response.json()
    } catch (error) {
      return {
        ok: false,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        version: 'unknown'
      }
    }
  }

  const getSystemStatus = async (): Promise<ApiResponse<SystemStatus>> => {
    return await get('/api/status')
  }

  return {
    healthCheck,
    getSystemStatus
  }
}