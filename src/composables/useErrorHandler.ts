import type { ApiResponse, ValidationError } from '~/types'

interface ErrorNotification {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    handler: () => void
  }
}

export const useErrorHandler = () => {
  const notifications = ref<ErrorNotification[]>([])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const addNotification = (notification: Omit<ErrorNotification, 'id'>) => {
    const id = generateId()
    const newNotification: ErrorNotification = {
      id,
      duration: 5000,
      ...notification
    }

    notifications.value.push(newNotification)

    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const handleApiError = (response: ApiResponse, context?: string) => {
    const title = context ? `${context} Error` : 'API Error'
    
    if (response.details && Array.isArray(response.details)) {
      const validationErrors = response.details as ValidationError[]
      const messages = validationErrors.map(err => `${err.field}: ${err.message}`).join(', ')
      
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: messages,
        duration: 8000
      })
    } else {
      addNotification({
        type: 'error',
        title,
        message: response.error || 'An unexpected error occurred',
        duration: 6000
      })
    }
  }

  const handleNetworkError = (error: Error, context?: string) => {
    let message = 'Network connection failed. Please check your internet connection.'
    
    if (error.message.includes('timeout')) {
      message = 'Request timed out. Please try again.'
    } else if (error.message.includes('Network Error')) {
      message = 'Unable to connect to server. Please try again later.'
    }

    addNotification({
      type: 'error',
      title: context ? `${context} - Connection Error` : 'Connection Error',
      message,
      duration: 8000,
      action: {
        label: 'Retry',
        handler: () => {
          window.location.reload()
        }
      }
    })
  }

  const handleUnauthorizedError = () => {
    addNotification({
      type: 'warning',
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      persistent: true,
      action: {
        label: 'Login',
        handler: async () => {
          const { logout } = useAuth()
          await logout()
          await navigateTo('/login')
        }
      }
    })
  }

  const handleForbiddenError = () => {
    addNotification({
      type: 'error',
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.',
      duration: 6000
    })
  }

  const handleGenericError = (error: Error | string, context?: string) => {
    const message = typeof error === 'string' ? error : error.message
    
    addNotification({
      type: 'error',
      title: context ? `${context} Error` : 'Error',
      message: message || 'An unexpected error occurred',
      duration: 5000
    })
  }

  const showSuccess = (message: string, title: string = 'Success') => {
    addNotification({
      type: 'info',
      title,
      message,
      duration: 3000
    })
  }

  const showWarning = (message: string, title: string = 'Warning') => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000
    })
  }

  const handleError = (error: any, context?: string) => {
    console.error(`[${context || 'Unknown'}] Error:`, error)

    if (error?.response?.status === 401) {
      handleUnauthorizedError()
    } else if (error?.response?.status === 403) {
      handleForbiddenError()
    } else if (error?.response?.data) {
      handleApiError(error.response.data, context)
    } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
      handleNetworkError(error, context)
    } else {
      handleGenericError(error, context)
    }
  }

  const wrapWithErrorHandling = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args)
      } catch (error) {
        handleError(error, context)
        return null
      }
    }
  }

  return {
    notifications: readonly(notifications),
    addNotification,
    removeNotification,
    clearAllNotifications,
    handleApiError,
    handleNetworkError,
    handleUnauthorizedError,
    handleForbiddenError,
    handleGenericError,
    handleError,
    showSuccess,
    showWarning,
    wrapWithErrorHandling
  }
}