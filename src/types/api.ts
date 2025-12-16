export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  details?: any
  pagination?: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  rows: T[]
  count: number
  pagination: PaginationMeta
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ApiError {
  ok: false
  error: string
  details?: ValidationError[] | any
}

export type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, string | number>
}

export interface LoadingState {
  loading: boolean
  error: string | null
  lastFetch: Date | null
}