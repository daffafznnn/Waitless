export interface CreateLocationRequest {
  name: string
  address?: string
  phone?: string
  description?: string
}

export interface UpdateLocationRequest {
  name?: string
  address?: string
  description?: string
}

export interface LocationWithOwner {
  id: number
  name: string
  address?: string
  city?: string
  lat?: number
  lng?: number
  phone?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  owner: {
    id: number
    name: string
    email: string
  }
}

export interface LocationStatus {
  location: {
    id: number
    name: string
  }
  date: string
  counters: Array<{
    id: number
    name: string
    prefix: string
    capacityStatus: {
      capacity: number
      issued: number
      available: number
      isAtCapacity: boolean
    }
  }>
  summary: {
    totalCapacity: number
    totalIssued: number
    totalAvailable: number
    utilizationRate: number
  }
}

export interface LocationMember {
  id: number
  location_id: number
  user_id: number
  role: string
  is_active: boolean
  created_at: string
  user: {
    id: number
    name: string
    email: string
    phone?: string
  }
}

export interface AddMemberRequest {
  userId: number
}

export interface SystemStatus {
  server: string
  database: string
  jobs: {
    dailySummary: boolean
    weeklyCleanup: boolean
  }
  lastDailySummaryRun: string
}

export interface HealthCheck {
  ok: boolean
  message: string
  timestamp: string
  version: string
}