import type { LoadingState } from '~/types'

interface UseLoadingStateOptions {
  initialLoading?: boolean
  timeout?: number
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const loading = ref(options.initialLoading || false)
  const error = ref<string | null>(null)
  const lastFetch = ref<Date | null>(null)
  const timeoutId = ref<number | null>(null)

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
    
    if (isLoading) {
      error.value = null
      
      if (options.timeout) {
        if (timeoutId.value) clearTimeout(timeoutId.value)
        timeoutId.value = setTimeout(() => {
          if (loading.value) {
            setError('Request timed out')
            loading.value = false
          }
        }, options.timeout)
      }
    } else {
      lastFetch.value = new Date()
      if (timeoutId.value) clearTimeout(timeoutId.value)
      timeoutId.value = null
    }
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
    loading.value = false
    if (timeoutId.value) clearTimeout(timeoutId.value)
    timeoutId.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    loading.value = false
    error.value = null
    lastFetch.value = null
    if (timeoutId.value) clearTimeout(timeoutId.value)
    timeoutId.value = null
  }

  const state = computed<LoadingState>(() => ({
    loading: loading.value,
    error: error.value,
    lastFetch: lastFetch.value
  }))

  onUnmounted(() => {
    if (timeoutId.value) clearTimeout(timeoutId.value)
  })

  return {
    loading: readonly(loading),
    error: readonly(error),
    lastFetch: readonly(lastFetch),
    state,
    setLoading,
    setError,
    clearError,
    reset
  }
}

export const useAsyncState = <T>(
  asyncFunction: () => Promise<T>,
  initialValue?: T,
  options: UseLoadingStateOptions & {
    immediate?: boolean
    onError?: (error: any) => void
    onSuccess?: (data: T) => void
  } = {}
) => {
  const data = ref<T | undefined>(initialValue)
  const { loading, error, setLoading, setError, clearError, state } = useLoadingState(options)

  const execute = async (): Promise<T | undefined> => {
    try {
      setLoading(true)
      clearError()
      
      const result = await asyncFunction()
      data.value = result
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      setError(errorMessage)
      
      if (options.onError) {
        options.onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => execute()

  if (options.immediate !== false) {
    execute()
  }

  return {
    data: readonly(data),
    loading,
    error,
    state,
    execute,
    refresh
  }
}

export const useDebouncedLoading = (delay: number = 300) => {
  const loading = ref(false)
  const showLoading = ref(false)
  const timeoutId = ref<number | null>(null)

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading

    if (timeoutId.value) {
      if (timeoutId.value) clearTimeout(timeoutId.value)
      timeoutId.value = null
    }

    if (isLoading) {
      timeoutId.value = setTimeout(() => {
        showLoading.value = true
      }, delay)
    } else {
      showLoading.value = false
    }
  }

  onUnmounted(() => {
    if (timeoutId.value) {
      if (timeoutId.value) clearTimeout(timeoutId.value)
    }
  })

  return {
    loading: readonly(loading),
    showLoading: readonly(showLoading),
    setLoading
  }
}

export const useMultipleLoadingStates = <T extends Record<string, any>>(
  initialStates: T
) => {
  const states = reactive<Record<keyof T, LoadingState>>({} as any)
  
  Object.keys(initialStates).forEach(key => {
    states[key] = {
      loading: false,
      error: null,
      lastFetch: null
    }
  })

  const setLoading = (key: keyof T, loading: boolean, error: string | null = null) => {
    states[key] = {
      loading,
      error,
      lastFetch: loading ? null : new Date()
    }
  }

  const setError = (key: keyof T, error: string | null) => {
    states[key] = {
      ...states[key],
      loading: false,
      error
    }
  }

  const clearError = (key: keyof T) => {
    states[key] = {
      ...states[key],
      error: null
    }
  }

  const isAnyLoading = computed(() => {
    return Object.values(states).some(state => state.loading)
  })

  const hasAnyError = computed(() => {
    return Object.values(states).some(state => state.error !== null)
  })

  const getAllErrors = computed(() => {
    return Object.entries(states)
      .filter(([_, state]) => state.error)
      .map(([key, state]) => ({ key, error: state.error }))
  })

  const reset = (key?: keyof T) => {
    if (key) {
      states[key] = {
        loading: false,
        error: null,
        lastFetch: null
      }
    } else {
      Object.keys(states).forEach(k => {
        states[k] = {
          loading: false,
          error: null,
          lastFetch: null
        }
      })
    }
  }

  return {
    states: readonly(states),
    setLoading,
    setError,
    clearError,
    isAnyLoading,
    hasAnyError,
    getAllErrors,
    reset
  }
}