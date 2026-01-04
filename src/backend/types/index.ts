/* FILE: src/server/types/index.ts */
/**
 * Centralized Type Definitions for Waitless Backend
 * 
 * All shared interfaces and types should be defined here
 * to ensure consistency across services and controllers.
 */

import { Ticket, TicketStatus } from '../models/ticket.model';
import { Counter } from '../models/counter.model';
import { ServiceLocation } from '../models/service_location.model';
import { User, Role } from '../models/user.model';
import { EventType } from '../models/ticket_event.model';

// ============================================
// Pagination Types
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  rows: T[];
  count: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// Queue Types
// ============================================

export interface IssueTicketRequest {
  locationId: number;
  counterId: number;
  userId?: number;
  dateFor?: string;
}

export interface CallNextResponse {
  ticket: Ticket | null;
  queueNumber?: string;
  message: string;
}

export interface TicketActionResult {
  ticket: Ticket;
  message: string;
}

export interface QueueStats {
  waiting: number;
  calling: number;
  serving: number;
  hold: number;
  done: number;
  cancelled: number;
}

export interface QueuePosition {
  position: number;
  estimatedWaitMinutes: number;
  ticketsAhead: number;
}

// ============================================
// Counter Types
// ============================================

export interface CreateCounterRequest {
  locationId?: number;
  name: string;
  description?: string;
  prefix: string;
  openTime?: string;
  closeTime?: string;
  capacityPerDay?: number;
}

export interface UpdateCounterRequest {
  name?: string;
  description?: string;
  prefix?: string;
  openTime?: string;
  closeTime?: string;
  capacityPerDay?: number;
  isActive?: boolean;
}

export interface CounterWithStatus extends Counter {
  capacityStatus: {
    capacity: number;
    issued: number;
    available: number;
    isAtCapacity: boolean;
  };
}

// ============================================
// Location Types
// ============================================

export interface CreateLocationRequest {
  name: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateLocationRequest {
  name?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
}

export interface LocationWithCounters extends ServiceLocation {
  counters: Counter[];
}

// ============================================
// Admin Dashboard Types
// ============================================

export interface DashboardStats {
  todayStats: {
    totalIssued: number;
    totalDone: number;
    totalWaiting: number;
    totalCalling: number;
    totalCancelled: number;
    avgServiceTimeMinutes: number;
  };
  locationCount: number;
  counterCount: number;
}

export interface ActiveQueueItem {
  locationId: number;
  locationName: string;
  counterId: number;
  counterName: string;
  waiting: number;
  calling: number;
  serving: number;
}

// ============================================
// User & Staff Types
// ============================================

export interface InviteStaffRequest {
  email: string;
  name: string;
  locationId: number;
  role: string;
  password?: string;
}

export interface UpdateStaffRequest {
  name?: string;
  role?: string;
  locationId?: number;
  is_active?: boolean;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: Role;
  locationId: number;
  locationName: string;
  isActive: boolean;
}

export interface AddLocationMemberRequest {
  userId?: number;
  email?: string;
  role: Role;
}

// ============================================
// Analytics Types
// ============================================

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsSummary {
  totalIssued: number;
  totalDone: number;
  totalCancelled: number;
  totalHold: number;
  avgServiceTimeSeconds: number;
  peakHour: number;
  busiestDay: string;
}

export interface DailySummaryData {
  date: string;
  issued: number;
  done: number;
  cancelled: number;
  hold: number;
  avgServiceSeconds: number;
}

// ============================================
// Event Types
// ============================================

export interface TicketEventData {
  ticketId: number;
  actorId?: number;
  eventType: EventType;
  note?: string;
}

export interface ActivityLogEntry {
  id: number;
  ticketId: number;
  queueNumber: string;
  eventType: EventType;
  actorName?: string;
  note?: string;
  createdAt: Date;
}

// ============================================
// Job Types
// ============================================

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobPayload {
  [key: string]: any;
}

export interface QueueJob {
  id: string;
  type: string;
  payload: JobPayload;
  priority: JobPriority;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retries: number;
  maxRetries: number;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================
// Auth Types
// ============================================

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

// ============================================
// Utility Types
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Re-export model types for convenience
export { TicketStatus, EventType, Role };
export type { Ticket, Counter, ServiceLocation, User };
