/* FILE: src/server/types/errors.ts */
/**
 * Custom Error Classes for Waitless Backend
 * 
 * These errors are designed to be caught by asyncHandler
 * and converted to appropriate HTTP responses.
 */

/**
 * Base application error with status code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly for instanceof to work correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validation error (400)
 * Use when input data fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
  }
}

/**
 * Not found error (404)
 * Use when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} tidak ditemukan`, 404);
  }
}

/**
 * Authentication error (401)
 * Use when user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Autentikasi diperlukan') {
    super(message, 401);
  }
}

/**
 * Authorization/Forbidden error (403)
 * Use when user doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Akses tidak diizinkan') {
    super(message, 403);
  }
}

/**
 * Conflict error (409)
 * Use for duplicate entries or conflicting state
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource sudah ada') {
    super(message, 409);
  }
}

/**
 * Business logic error (400)
 * Use when operation violates business rules
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
  }
}

/**
 * Rate limit error (429)
 * Use when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Terlalu banyak request, coba lagi nanti') {
    super(message, 429);
  }
}

/**
 * Service unavailable error (503)
 * Use when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Layanan tidak tersedia sementara') {
    super(message, 503);
  }
}

/**
 * Database error (500)
 * Use for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Terjadi kesalahan database') {
    super(message, 500, false);
  }
}

/**
 * Invalid ID error (400)
 * Use when an ID parameter is invalid
 */
export class InvalidIdError extends ValidationError {
  constructor(paramName: string = 'ID') {
    super(`${paramName} tidak valid`);
  }
}

/**
 * Capacity error (400)
 * Use when queue/counter capacity is reached
 */
export class CapacityError extends BusinessLogicError {
  constructor(message: string = 'Kapasitas antrian sudah penuh') {
    super(message);
  }
}

/**
 * Counter closed error (400)
 * Use when counter is not within operating hours
 */
export class CounterClosedError extends BusinessLogicError {
  constructor(openTime: string, closeTime: string) {
    super(`Loket hanya buka ${openTime.slice(0,5)} - ${closeTime.slice(0,5)}`);
  }
}

/**
 * Location closed error (400)
 * Use when location is not active
 */
export class LocationClosedError extends BusinessLogicError {
  constructor() {
    super('Cabang sedang tutup, tidak dapat mengambil antrian');
  }
}

/**
 * Invalid ticket status error (400)
 * Use when ticket status doesn't allow the operation
 */
export class InvalidTicketStatusError extends BusinessLogicError {
  constructor(operation: string, allowedStatuses: string[]) {
    super(`Hanya bisa ${operation} tiket dengan status: ${allowedStatuses.join(', ')}`);
  }
}

/**
 * Duplicate ticket error (409)
 * Use when user already has an active ticket for the same counter
 */
export class DuplicateTicketError extends ConflictError {
  constructor(counterName?: string) {
    super(counterName 
      ? `Anda sudah memiliki antrian aktif di loket ${counterName}` 
      : 'Anda sudah memiliki antrian aktif di loket ini');
  }
}

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Extract error details for logging
 */
export function getErrorDetails(error: Error): object {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      details: error.details,
      stack: error.stack,
    };
  }
  
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 500, false);
  }
  
  return new AppError('An unexpected error occurred', 500, false);
}
