/* FILE: src/composables/useApi.ts */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '~/types'

interface UseApiOptions {
  baseURL?: string
  timeout?: number
  withCredentials?: boolean
}

export const useApi = (options: UseApiOptions = {}) => {
  const config = useRuntimeConfig()
  
  // Create axios instance
  const api: AxiosInstance = axios.create({
    baseURL: options.baseURL || config.public.apiBaseUrl,
    timeout: options.timeout || 30000,
    withCredentials: options.withCredentials ?? true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // Add any additional headers or auth tokens here
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  api.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      return response
    },
    async (error) => {
      // Handle common errors
      if (error.response?.status === 401) {
        // Unauthorized - redirect to appropriate login page
        if (import.meta.client) {
          const currentPath = window.location.pathname
          if (currentPath.startsWith('/admin')) {
            await navigateTo('/admin/login')
          } else if (currentPath.startsWith('/owner')) {
            await navigateTo('/owner/login')
          } else {
            // Default to homepage for unauthorized general requests
            await navigateTo('/')
          }
        }
      }
      
      return Promise.reject(error)
    }
  )

  // Generic request wrapper
  const request = async <T = any>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await api.request<ApiResponse<T>>(config)
      return response.data
    } catch (error: any) {
      // Handle axios errors
      if (error.response?.data) {
        return error.response.data
      }
      
      return {
        ok: false,
        error: error.message || 'An unexpected error occurred'
      }
    }
  }

  // HTTP method helpers
  const get = <T = any>(url: string, config?: AxiosRequestConfig) => {
    return request<T>({ method: 'GET', url, ...config })
  }

  const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request<T>({ method: 'POST', url, data, ...config })
  }

  const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request<T>({ method: 'PUT', url, data, ...config })
  }

  const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request<T>({ method: 'PATCH', url, data, ...config })
  }

  const del = <T = any>(url: string, config?: AxiosRequestConfig) => {
    return request<T>({ method: 'DELETE', url, ...config })
  }

  return {
    api,
    request,
    get,
    post,
    put,
    patch,
    delete: del
  }
}