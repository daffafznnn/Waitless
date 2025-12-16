export interface CreateCounterRequest {
  locationId: number
  name: string
  description?: string
  prefix: string
  openTime?: string
  closeTime?: string
  capacityPerDay?: number
}

export interface UpdateCounterRequest {
  name?: string
  description?: string
  capacityPerDay?: number
  isActive?: boolean
}

export interface QueueStatistics {
  total: number
  waiting: number
  calling: number
  serving: number
  hold: number
  done: number
  cancelled: number
}

export interface CounterQueueStatus {
  counter: {
    id: number
    name: string
    prefix: string
  }
  date: string
  statistics: QueueStatistics
  currentTicket?: {
    id: number
    queue_number: string
    status: string
  }
  recentActivity: Array<{
    id: number
    queue_number: string
    status: string
    finished_at?: string
  }>
}

export interface ActivityLog {
  id: number
  ticket_id: number
  actor_id: number
  event_type: string
  note?: string
  created_at: string
  ticket: {
    queue_number: string
  }
  actor: {
    name: string
  }
}

export interface DailySummary {
  date: string
  location: {
    id: number
    name: string
  }
  statistics: {
    total_issued: number
    total_done: number
    total_hold: number
    total_cancel: number
    avg_service_seconds: number
  }
  counters: Array<{
    id: number
    name: string
    issued: number
    done: number
    utilization: number
  }>
  hourlyDistribution: Record<string, number>
}

export interface DashboardStats {
  overview: {
    totalCounters: number
    activeCounters: number
    totalCapacity: number
    todayIssued: number
    utilizationRate: number
  }
  realTime: {
    currentlyWaiting: number
    currentlyServing: number
    averageWaitTime: number
    peakHour: string
  }
  trends: {
    vsYesterday: {
      issued: string
      completed: string
      avgWaitTime: string
    }
    vsLastWeek: {
      issued: string
      completed: string
      avgWaitTime: string
    }
  }
  counters: Array<{
    id: number
    name: string
    status: string
    currentQueue: number
    todayServed: number
    efficiency: number
  }>
}