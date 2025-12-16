/* FILE: src/types/index.ts */

// User and Authentication Types
export enum Role {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  VISITOR = 'VISITOR'
}

export interface LoadingState {
  loading: boolean
  error: string | null
  lastFetch: Date | null
}

export interface User {
  id: number
  email: string
  name: string
  phone?: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserWithToken {
  user: User
  token: string
}

export interface LoginRequest {
  email: string
  password: string
  role?: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
  role?: Role
}

export interface UpdateProfileRequest {
  name?: string
  phone?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export interface AuthResponse {
  ok: boolean
  data?: {
    user: User
    token?: string
  }
  error?: string
}

// Queue and Ticket Types
export enum TicketStatus {
  WAITING = 'WAITING',
  CALLING = 'CALLING', 
  SERVING = 'SERVING',
  HOLD = 'HOLD',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum EventType {
  ISSUED = 'ISSUED',
  CALLED = 'CALLED',
  RESUMED = 'RESUMED', 
  HELD = 'HELD',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface Ticket {
  id: number
  queue_number: string
  status: TicketStatus
  location_id: number
  counter_id: number
  date_for: string
  visitor_name?: string
  visitor_phone?: string
  hold_reason?: string
  priority_level: number
  estimated_wait_minutes?: number
  issued_at: string
  called_at?: string
  started_at?: string
  finished_at?: string
  created_at: string
  updated_at: string
  // Relations
  location?: ServiceLocation
  counter?: Counter
  events?: TicketEvent[]
}

export interface TicketEvent {
  id: number
  ticket_id: number
  actor_id?: number
  event_type: EventType
  description?: string
  created_at: string
  // Relations
  ticket?: Ticket
  actor?: User
}

// Location and Counter Types
export interface ServiceLocation {
  id: number
  owner_id: number
  name: string
  description?: string
  address?: string
  city?: string
  lat?: number
  lng?: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  owner?: User
  counters?: Counter[]
  members?: LocationMember[]
}

export interface Counter {
  id: number
  location_id: number
  name: string
  description?: string
  prefix: string
  open_time: string
  close_time: string
  capacity_per_day: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  location?: ServiceLocation
  tickets?: Ticket[]
  // Computed fields
  capacityStatus?: {
    capacity: number
    issued: number
    available: number
    isAtCapacity: boolean
  }
}

export interface CounterWithStatus extends Counter {
  capacityStatus: {
    capacity: number
    issued: number
    available: number
    isAtCapacity: boolean
  }
  queueStatus: {
    waiting: number
    serving: number
    done: number
  }
}

export interface CounterQueueStatus {
  counter: {
    id: number
    name: string
    prefix: string
  }
  date: string
  statistics: {
    total: number
    waiting: number
    calling: number
    serving: number
    hold: number
    done: number
    cancelled: number
  }
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

export interface LocationMember {
  id: number
  location_id: number
  user_id: number
  role: 'ADMIN' | 'MEMBER'
  created_at: string
  updated_at: string
  // Relations
  location?: ServiceLocation
  user?: User
}

// Summary and Analytics Types
export interface DailySummary {
  id: number
  location_id: number
  date_for: string
  total_issued: number
  total_done: number
  total_hold: number
  total_cancel: number
  avg_service_seconds: number
  created_at: string
  updated_at: string
  // Relations
  location?: ServiceLocation
  // Computed fields
  completionRate?: number
}

// API Response Types
export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  details?: any
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface PaginatedResponse<T> {
  rows: T[]
  count: number
}

// Queue Management Types
export interface CallNextResponse {
  ticket?: Ticket
  message: string
  queueInfo: {
    waitingCount: number
    nextNumber?: string
  }
}

export interface QueueStatusResponse {
  counter: Counter
  currentTicket?: Ticket
  waitingCount: number
  totalToday: number
  avgWaitTime: number
  isOpen: boolean
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

export interface EstimateResponse {
  estimatedMinutes: number
  position: number
  message: string
}

export interface IssueTicketResponse {
  ticket: Ticket
  estimatedWaitMinutes: number
  queuePosition: number
}

// Form Types
export interface CreateLocationRequest {
  name: string
  description?: string
  address?: string
  phone?: string
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

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  is_active?: boolean
}

export interface CreateCounterRequest {
  locationId: number
  name: string
  description?: string
  prefix: string
  openTime: string
  closeTime: string
  capacityPerDay: number
}

export interface UpdateCounterRequest extends Partial<Omit<CreateCounterRequest, 'locationId'>> {
  is_active?: boolean
}

// UI State Types
export interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
}

export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebar: SidebarState
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  createdAt: Date
}

// Component Props Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
}

export interface StatusBadgeProps {
  status: TicketStatus | 'online' | 'offline' | 'active' | 'inactive'
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
}

export interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period?: string
  }
  icon?: string
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export interface DataTableColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T) => any
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  selectable?: boolean
  selectedRows?: any[]
  emptyState?: {
    title: string
    description: string
    icon?: string
  }
}

// Filter and Pagination Types
export interface FilterParams {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  pages: number
}

// Error Types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface AppError extends Error {
  statusCode?: number
  details?: any
  validationErrors?: ValidationError[]
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Navigation Types
export interface NavItem {
  name: string
  href: string
  icon?: string
  badge?: string | number
  children?: NavItem[]
  roles?: Role[]
}

export interface Breadcrumb {
  label: string
  href?: string
  current?: boolean
}

// Real-time Types
export interface SocketEvent {
  type: string
  data: any
  timestamp: Date
}

export interface QueueUpdate extends SocketEvent {
  type: 'queue_update'
  data: {
    counterId: number
    locationId: number
    currentTicket?: Ticket
    waitingCount: number
  }
}

export interface TicketUpdate extends SocketEvent {
  type: 'ticket_update'  
  data: {
    ticket: Ticket
    event: TicketEvent
  }
}