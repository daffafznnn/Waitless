/* FILE: src/server/services/BaseService.ts */
/**
 * Base Service Class for Waitless Backend
 * 
 * Provides common functionality for all services:
 * - Transaction wrapping
 * - Error handling
 * - ID validation
 * - Logging utilities
 */

import { Transaction } from 'sequelize';
import { sequelize } from '../db';
import { validateId, validatePositiveInteger } from '../utils/validators';
import { 
  AppError, 
  toAppError, 
  NotFoundError,
  ValidationError 
} from '../types/errors';
import { getTodayForDb, getJakartaDateString } from '../utils/datetime';

export type TransactionCallback<T> = (transaction: Transaction) => Promise<T>;

export abstract class BaseService {
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Wrap operation in a database transaction with specified isolation level
   */
  protected async withTransaction<T>(
    callback: TransactionCallback<T>,
    isolationLevel: Transaction.ISOLATION_LEVELS = Transaction.ISOLATION_LEVELS.READ_COMMITTED
  ): Promise<T> {
    return sequelize.transaction({ isolationLevel }, callback);
  }

  /**
   * Wrap operation in REPEATABLE_READ transaction (for critical operations)
   */
  protected async withRepeatableRead<T>(
    callback: TransactionCallback<T>
  ): Promise<T> {
    return this.withTransaction(callback, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);
  }

  /**
   * Validate and convert ID parameter
   * Handles various input types (number, string, bigint)
   */
  protected validateId(value: unknown, paramName: string = 'ID'): number {
    return validateId(value, paramName);
  }

  /**
   * Validate positive integer parameter
   */
  protected validatePositiveInt(
    value: unknown,
    paramName: string,
    options?: { min?: number; max?: number }
  ): number {
    return validatePositiveInteger(value, paramName, options);
  }

  /**
   * Validate required value exists
   */
  protected validateRequired<T>(value: T | undefined | null, paramName: string): T {
    if (value === undefined || value === null) {
      throw new ValidationError(`${paramName} wajib diisi`);
    }
    return value;
  }

  /**
   * Get today's date in Jakarta timezone (YYYY-MM-DD format)
   */
  protected getTodayDate(): string {
    return getTodayForDb();
  }

  /**
   * Get date for queries, defaulting to today in Jakarta time
   */
  protected getQueryDate(date?: string): string {
    return date || getJakartaDateString();
  }

  /**
   * Handle errors consistently
   * Logs error and re-throws as AppError
   */
  protected handleError(error: unknown, context: string): never {
    const appError = toAppError(error);
    
    // Log the error with context
    console.error(`[${this.serviceName}] ${context}:`, {
      message: appError.message,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational,
    });
    
    throw appError;
  }

  /**
   * Log info message with service context
   */
  protected log(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log(`[${this.serviceName}] ${message}`, data || '');
    }
  }

  /**
   * Log warning message with service context
   */
  protected warn(message: string, data?: Record<string, unknown>): void {
    console.warn(`[${this.serviceName}] WARN: ${message}`, data || '');
  }

  /**
   * Log error message with service context
   */
  protected error(message: string, error?: Error | unknown): void {
    console.error(`[${this.serviceName}] ERROR: ${message}`, error || '');
  }

  /**
   * Check if entity exists and throw NotFoundError if not
   */
  protected ensureExists<T>(
    entity: T | null | undefined,
    resourceName: string
  ): T {
    if (!entity) {
      throw new NotFoundError(resourceName);
    }
    return entity;
  }

  /**
   * Safely parse pagination parameters
   */
  protected parsePagination(page?: unknown, limit?: unknown): {
    page: number;
    limit: number;
    offset: number;
  } {
    const parsedPage = page ? this.validatePositiveInt(page, 'Page') : 1;
    let parsedLimit = limit ? this.validatePositiveInt(limit, 'Limit') : 20;
    
    // Cap limit at 100
    if (parsedLimit > 100) {
      parsedLimit = 100;
    }
    
    return {
      page: parsedPage,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    };
  }

  /**
   * Create pagination metadata
   */
  protected createPaginationMeta(
    total: number,
    page: number,
    limit: number
  ): {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const pages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }

  /**
   * Execute with retry logic for transient failures
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry operational errors
        if (error instanceof AppError && error.isOperational) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          this.warn(`Attempt ${attempt} failed, retrying...`, {
            error: lastError.message,
          });
          await this.delay(delayMs * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Delay execution
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Measure execution time
   */
  protected async measureTime<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      this.log(`${label} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed after ${duration}ms`, error);
      throw error;
    }
  }
}
