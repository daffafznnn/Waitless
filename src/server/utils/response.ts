/* FILE: src/server/utils/response.ts */
import { Response } from 'express';
import { ZodError } from 'zod';

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  statusCode: number = 200,
  pagination?: any
): void => {
  const response: ApiResponse<T> = {
    ok: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
  details?: any
): void => {
  const response: ApiResponse = {
    ok: false,
    error,
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

/**
 * Send validation error response (for Zod errors)
 */
export const sendValidationError = (
  res: Response,
  zodError: ZodError
): void => {
  const details = zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  sendError(res, 'Validation failed', 400, details);
};

/**
 * Send not found response
 */
export const sendNotFound = (
  res: Response,
  resource: string = 'Resource'
): void => {
  sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Authentication required'
): void => {
  sendError(res, message, 401);
};

/**
 * Send forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Insufficient permissions'
): void => {
  sendError(res, message, 403);
};

/**
 * Send server error response
 */
export const sendServerError = (
  res: Response,
  message: string = 'Internal server error'
): void => {
  sendError(res, message, 500);
};

/**
 * Send created response
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  _message?: string
): void => {
  sendSuccess(res, data, 201);
};

/**
 * Handle async controller errors
 */
export const asyncHandler = (
  fn: (req: any, res: Response, next: any) => Promise<any>
) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Async handler error:', error);
      
      // Handle different error types
      if (error instanceof ZodError) {
        sendValidationError(res, error);
        return;
      }
      
      if (error.message) {
        // Known error with message
        const statusCode = error.statusCode || 400;
        sendError(res, error.message, statusCode, error.details);
        return;
      }
      
      // Unknown error
      sendServerError(res, 'An unexpected error occurred');
    });
  };
};

/**
 * Create paginated response helper
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode: number = 200
): void => {
  const pages = Math.ceil(total / limit);
  
  sendSuccess(res, data, statusCode, {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  });
};

/**
 * Standard error messages
 */
export const ErrorMessages = {
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  VALIDATION_FAILED: 'Validation failed',
  RESOURCE_NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',
  ACCESS_DENIED: 'Access denied',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_DISABLED: 'Account is disabled',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_REQUEST: 'Invalid request',
} as const;

/**
 * HTTP Status codes
 */
export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Success response helper for different scenarios
 */
export class ResponseHelper {
  static success<T>(res: Response, data?: T, _message?: string) {
    return sendSuccess(res, data, StatusCodes.OK);
  }

  static created<T>(res: Response, data: T, _message?: string) {
    return sendSuccess(res, data, StatusCodes.CREATED);
  }

  static noContent(res: Response) {
    res.status(StatusCodes.NO_CONTENT).send();
  }

  static badRequest(res: Response, message?: string, details?: any) {
    return sendError(res, message || ErrorMessages.INVALID_REQUEST, StatusCodes.BAD_REQUEST, details);
  }

  static unauthorized(res: Response, message?: string) {
    return sendError(res, message || ErrorMessages.AUTHENTICATION_REQUIRED, StatusCodes.UNAUTHORIZED);
  }

  static forbidden(res: Response, message?: string) {
    return sendError(res, message || ErrorMessages.INSUFFICIENT_PERMISSIONS, StatusCodes.FORBIDDEN);
  }

  static notFound(res: Response, message?: string) {
    return sendError(res, message || ErrorMessages.RESOURCE_NOT_FOUND, StatusCodes.NOT_FOUND);
  }

  static conflict(res: Response, message?: string) {
    return sendError(res, message || ErrorMessages.DUPLICATE_ENTRY, StatusCodes.CONFLICT);
  }

  static serverError(res: Response, message?: string) {
    return sendError(res, message || ErrorMessages.INTERNAL_ERROR, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  static validationError(res: Response, zodError: ZodError) {
    return sendValidationError(res, zodError);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number
  ) {
    return sendPaginatedResponse(res, data, total, page, limit);
  }
}