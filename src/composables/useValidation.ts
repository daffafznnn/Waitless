import { z } from 'zod'
import type { ValidationError } from '~/types'

interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export const useValidation = () => {
  const validate = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): ValidationResult<T> => {
    try {
      const result = schema.safeParse(data)
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        }
      } else {
        const errors: ValidationError[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
        
        return {
          success: false,
          errors
        }
      }
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error.message || 'Validation error occurred',
          code: 'validation_error'
        }]
      }
    }
  }

  const validateAsync = async <T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): Promise<ValidationResult<T>> => {
    try {
      const result = await schema.safeParseAsync(data)
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        }
      } else {
        const errors: ValidationError[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
        
        return {
          success: false,
          errors
        }
      }
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error.message || 'Validation error occurred',
          code: 'validation_error'
        }]
      }
    }
  }

  const getFirstError = (errors?: ValidationError[]): string | null => {
    return errors && errors.length > 0 ? errors[0].message : null
  }

  const getFieldError = (errors?: ValidationError[], field?: string): string | null => {
    if (!errors || !field) return null
    
    const error = errors.find(err => err.field === field)
    return error ? error.message : null
  }

  const formatErrorMessage = (errors?: ValidationError[]): string => {
    if (!errors || errors.length === 0) return ''
    
    if (errors.length === 1) {
      return errors[0].message
    }
    
    return errors.map(err => `${err.field}: ${err.message}`).join(', ')
  }

  const createFormValidator = <T>(schema: z.ZodSchema<T>) => {
    const formErrors = ref<Record<string, string>>({})
    const isValid = ref(false)
    const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

    const validateForm = (data: unknown): ValidationResult<T> => {
      const result = validate(schema, data)
      
      formErrors.value = {}
      
      if (result.errors) {
        result.errors.forEach(error => {
          formErrors.value[error.field] = error.message
        })
      }
      
      isValid.value = result.success
      return result
    }

    const validateField = (fieldName: string, value: unknown): boolean => {
      try {
        const fieldSchema = (schema as any).shape?.[fieldName]
        if (!fieldSchema) return true

        fieldSchema.parse(value)
        delete formErrors.value[fieldName]
        return true
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          formErrors.value[fieldName] = error.errors[0]?.message || 'Validation error'
        }
        return false
      }
    }

    const clearFieldError = (fieldName: string) => {
      delete formErrors.value[fieldName]
    }

    const clearAllErrors = () => {
      formErrors.value = {}
    }

    const getFieldError = (fieldName: string): string | undefined => {
      return formErrors.value[fieldName]
    }

    return {
      formErrors: readonly(formErrors),
      isValid: readonly(isValid),
      hasErrors,
      validateForm,
      validateField,
      clearFieldError,
      clearAllErrors,
      getFieldError
    }
  }

  const createAsyncValidator = <T>(
    schema: z.ZodSchema<T>,
    asyncValidation?: (data: T) => Promise<ValidationError[]>
  ) => {
    const errors = ref<ValidationError[]>([])
    const isValidating = ref(false)
    const isValid = computed(() => errors.value.length === 0)

    const validateData = async (data: unknown): Promise<ValidationResult<T>> => {
      try {
        isValidating.value = true
        errors.value = []

        const syncResult = validate(schema, data)
        
        if (!syncResult.success) {
          errors.value = syncResult.errors || []
          return syncResult
        }

        if (asyncValidation && syncResult.data) {
          const asyncErrors = await asyncValidation(syncResult.data)
          errors.value = asyncErrors
          
          if (asyncErrors.length > 0) {
            return {
              success: false,
              errors: asyncErrors
            }
          }
        }

        return {
          success: true,
          data: syncResult.data
        }
      } catch (error: any) {
        const validationError: ValidationError = {
          field: 'general',
          message: error.message || 'Validation error occurred',
          code: 'async_validation_error'
        }
        
        errors.value = [validationError]
        
        return {
          success: false,
          errors: [validationError]
        }
      } finally {
        isValidating.value = false
      }
    }

    return {
      errors: readonly(errors),
      isValidating: readonly(isValidating),
      isValid,
      validateData
    }
  }

  return {
    validate,
    validateAsync,
    getFirstError,
    getFieldError,
    formatErrorMessage,
    createFormValidator,
    createAsyncValidator
  }
}