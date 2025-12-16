export type TicketStatus = 'WAITING' | 'CALLING' | 'SERVING' | 'HOLD' | 'DONE' | 'CANCELLED'

export interface Counter {
  id: number
  name: string
  description?: string
  prefix: string
  open_time?: string
  close_time?: string
  capacity_per_day?: number
  is_active: boolean
  location?: Location
}

export interface Location {
  id: number
  name: string
  address?: string
  city?: string
  lat?: number
  lng?: number
  phone?: string
  description?: string
  is_active: boolean
  owner?: User
  owner_id?: number
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  name: string
  email?: string
  phone?: string
  role?: string
}

export interface Ticket {
  id: number
  location_id: number
  counter_id: number
  user_id: number
  date_for: string
  sequence: number
  queue_number: string
  status: TicketStatus
  hold_reason?: string
  created_at: string
  called_at?: string
  started_at?: string
  finished_at?: string
  counter: Counter
  location?: Location
  user?: User
}

export interface IssueTicketRequest {
  locationId: number
  counterId: number
  userId?: number
  dateFor?: string
}

export interface CallNextRequest {
  counterId: number
}

export interface StartServingRequest {
  ticketId: number
}

export interface HoldTicketRequest {
  ticketId: number
  reason: string
}

export interface ResumeTicketRequest {
  ticketId: number
}

export interface MarkDoneRequest {
  ticketId: number
}

export interface CancelTicketRequest {
  ticketId: number
  reason: string
}

export interface QueueStatus {
  total: number
  waiting: number
  calling: number
  serving: number
  hold: number
  done: number
  cancelled: number
  current?: Ticket
  nextWaiting?: Ticket
}

export interface EstimateResponse {
  estimatedMinutes: number
  position: number
  message: string
}

export interface CapacityStatus {
  capacity: number
  issued: number
  available: number
  isAtCapacity: boolean
}

export interface CounterWithStatus extends Counter {
  capacityStatus: CapacityStatus
  queueStatus: QueueStatus
}