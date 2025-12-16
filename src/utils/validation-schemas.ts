import { z } from 'zod'

export const RoleSchema = z.enum(['VISITOR', 'ADMIN', 'OWNER'])

export const TicketStatusSchema = z.enum([
  'WAITING',
  'CALLING', 
  'SERVING',
  'HOLD',
  'DONE',
  'CANCELLED'
])

export const UserSchema = z.object({
  id: z.number().positive(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: RoleSchema,
  created_at: z.string(),
  updated_at: z.string().optional()
})

export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format').optional(),
  role: RoleSchema.optional().default('VISITOR')
})

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format').optional()
})

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
})

export const CounterSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  prefix: z.string().min(1).max(3),
  open_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  capacity_per_day: z.number().positive(),
  is_active: z.boolean(),
  location_id: z.number().positive()
})

export const CreateCounterRequestSchema = z.object({
  locationId: z.number().positive('Location ID is required'),
  name: z.string().min(1, 'Counter name is required'),
  description: z.string().optional(),
  prefix: z.string().min(1, 'Prefix is required').max(3, 'Prefix must be 3 characters or less'),
  openTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)').optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)').optional(),
  capacityPerDay: z.number().positive('Capacity must be greater than 0').optional()
})

export const UpdateCounterRequestSchema = z.object({
  name: z.string().min(1, 'Counter name is required').optional(),
  description: z.string().optional(),
  capacityPerDay: z.number().positive('Capacity must be greater than 0').optional(),
  isActive: z.boolean().optional()
})

export const LocationSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
  owner_id: z.number().positive(),
  created_at: z.string(),
  updated_at: z.string().optional()
})

export const CreateLocationRequestSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format').optional(),
  description: z.string().optional()
})

export const UpdateLocationRequestSchema = z.object({
  name: z.string().min(1, 'Location name is required').optional(),
  address: z.string().optional(),
  description: z.string().optional()
})

export const TicketSchema = z.object({
  id: z.number().positive(),
  location_id: z.number().positive(),
  counter_id: z.number().positive(),
  user_id: z.number().positive(),
  date_for: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  sequence: z.number().positive(),
  queue_number: z.string().min(1),
  status: TicketStatusSchema,
  hold_reason: z.string().optional(),
  created_at: z.string(),
  called_at: z.string().optional(),
  started_at: z.string().optional(),
  finished_at: z.string().optional()
})

export const IssueTicketRequestSchema = z.object({
  locationId: z.number().positive('Location ID is required'),
  counterId: z.number().positive('Counter ID is required'),
  userId: z.number().positive().optional(),
  dateFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional()
})

export const CallNextRequestSchema = z.object({
  counterId: z.number().positive('Counter ID is required')
})

export const StartServingRequestSchema = z.object({
  ticketId: z.number().positive('Ticket ID is required')
})

export const HoldTicketRequestSchema = z.object({
  ticketId: z.number().positive('Ticket ID is required'),
  reason: z.string().min(1, 'Hold reason is required')
})

export const ResumeTicketRequestSchema = z.object({
  ticketId: z.number().positive('Ticket ID is required')
})

export const MarkDoneRequestSchema = z.object({
  ticketId: z.number().positive('Ticket ID is required')
})

export const CancelTicketRequestSchema = z.object({
  ticketId: z.number().positive('Ticket ID is required'),
  reason: z.string().min(1, 'Cancel reason is required')
})

export const AddMemberRequestSchema = z.object({
  userId: z.number().positive('User ID is required')
})

export const PaginationParamsSchema = z.object({
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().max(100).optional().default(20)
})

export const DateFilterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional()
})

export const ApiResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    ok: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    details: z.any().optional(),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      pages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean()
    }).optional()
  })

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional()
})

export const QueueStatusSchema = z.object({
  total: z.number(),
  waiting: z.number(),
  calling: z.number(),
  serving: z.number(),
  hold: z.number(),
  done: z.number(),
  cancelled: z.number(),
  current: TicketSchema.optional(),
  nextWaiting: TicketSchema.optional()
})

export const EstimateResponseSchema = z.object({
  estimatedMinutes: z.number(),
  position: z.number(),
  message: z.string()
})

export const CapacityStatusSchema = z.object({
  capacity: z.number(),
  issued: z.number(),
  available: z.number(),
  isAtCapacity: z.boolean()
})

export const DashboardStatsSchema = z.object({
  overview: z.object({
    totalCounters: z.number(),
    activeCounters: z.number(),
    totalCapacity: z.number(),
    todayIssued: z.number(),
    utilizationRate: z.number()
  }),
  realTime: z.object({
    currentlyWaiting: z.number(),
    currentlyServing: z.number(),
    averageWaitTime: z.number(),
    peakHour: z.string()
  }),
  trends: z.object({
    vsYesterday: z.object({
      issued: z.string(),
      completed: z.string(),
      avgWaitTime: z.string()
    }),
    vsLastWeek: z.object({
      issued: z.string(),
      completed: z.string(),
      avgWaitTime: z.string()
    })
  }),
  counters: z.array(z.object({
    id: z.number(),
    name: z.string(),
    status: z.string(),
    currentQueue: z.number(),
    todayServed: z.number(),
    efficiency: z.number()
  }))
})

export const SystemStatusSchema = z.object({
  server: z.string(),
  database: z.string(),
  jobs: z.object({
    dailySummary: z.boolean(),
    weeklyCleanup: z.boolean()
  }),
  lastDailySummaryRun: z.string()
})

export const HealthCheckSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
  version: z.string()
})

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>
export type CreateCounterRequest = z.infer<typeof CreateCounterRequestSchema>
export type UpdateCounterRequest = z.infer<typeof UpdateCounterRequestSchema>
export type CreateLocationRequest = z.infer<typeof CreateLocationRequestSchema>
export type UpdateLocationRequest = z.infer<typeof UpdateLocationRequestSchema>
export type IssueTicketRequest = z.infer<typeof IssueTicketRequestSchema>
export type CallNextRequest = z.infer<typeof CallNextRequestSchema>
export type StartServingRequest = z.infer<typeof StartServingRequestSchema>
export type HoldTicketRequest = z.infer<typeof HoldTicketRequestSchema>
export type ResumeTicketRequest = z.infer<typeof ResumeTicketRequestSchema>
export type MarkDoneRequest = z.infer<typeof MarkDoneRequestSchema>
export type CancelTicketRequest = z.infer<typeof CancelTicketRequestSchema>
export type AddMemberRequest = z.infer<typeof AddMemberRequestSchema>
export type PaginationParams = z.infer<typeof PaginationParamsSchema>
export type DateFilter = z.infer<typeof DateFilterSchema>
export type ValidationError = z.infer<typeof ValidationErrorSchema>