/* FILE: src/server/utils/pagination.ts */
import { Request } from 'express';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parse pagination parameters from request query
 */
export const parsePagination = (
  req: Request,
  options: PaginationOptions = {}
): PaginationResult => {
  const {
    maxLimit = 100,
    defaultLimit = 20,
  } = options;

  // Parse page number (default to 1)
  let page = parseInt(req.query.page as string) || options.page || 1;
  if (page < 1) page = 1;

  // Parse limit (default to defaultLimit)
  let limit = parseInt(req.query.limit as string) || options.limit || defaultLimit;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  // Calculate offset
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Generate pagination metadata
 */
export const generatePaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    pages,
    hasNext,
    hasPrev,
  };
};

/**
 * Create paginated response object
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => {
  const meta = generatePaginationMeta(total, page, limit);
  
  return {
    data,
    pagination: meta,
  };
};

/**
 * Validate and sanitize pagination parameters
 */
export const validatePagination = (
  page?: number | string,
  limit?: number | string,
  maxLimit: number = 100
): { page: number; limit: number; offset: number } => {
  // Sanitize and validate page
  let validPage = 1;
  if (page) {
    const parsedPage = typeof page === 'string' ? parseInt(page) : page;
    if (!isNaN(parsedPage) && parsedPage > 0) {
      validPage = parsedPage;
    }
  }

  // Sanitize and validate limit
  let validLimit = 20;
  if (limit) {
    const parsedLimit = typeof limit === 'string' ? parseInt(limit) : limit;
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      validLimit = Math.min(parsedLimit, maxLimit);
    }
  }

  const offset = (validPage - 1) * validLimit;

  return {
    page: validPage,
    limit: validLimit,
    offset,
  };
};

/**
 * Get pagination links for API responses
 */
export const getPaginationLinks = (
  baseUrl: string,
  page: number,
  limit: number,
  totalPages: number,
  queryParams?: Record<string, any>
): {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
} => {
  const buildUrl = (targetPage: number) => {
    const url = new URL(baseUrl);
    url.searchParams.set('page', targetPage.toString());
    url.searchParams.set('limit', limit.toString());
    
    // Add additional query parameters
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value.toString());
        }
      });
    }
    
    return url.toString();
  };

  const links: any = {};

  // First page link
  if (page > 1) {
    links.first = buildUrl(1);
  }

  // Previous page link
  if (page > 1) {
    links.prev = buildUrl(page - 1);
  }

  // Next page link
  if (page < totalPages) {
    links.next = buildUrl(page + 1);
  }

  // Last page link
  if (page < totalPages) {
    links.last = buildUrl(totalPages);
  }

  return links;
};

/**
 * Advanced pagination with cursor-based pagination support
 */
export interface CursorPaginationOptions {
  limit?: number;
  cursor?: string;
  field?: string;
  direction?: 'ASC' | 'DESC';
}

export interface CursorPaginationResult {
  limit: number;
  cursor?: string;
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Parse cursor-based pagination parameters
 */
export const parseCursorPagination = (
  req: Request,
  options: CursorPaginationOptions = {}
): CursorPaginationResult => {
  const {
    limit: defaultLimit = 20,
    field = 'id',
    direction = 'DESC',
  } = options;

  const limit = Math.min(
    parseInt(req.query.limit as string) || defaultLimit,
    100 // Max limit
  );

  const cursor = req.query.cursor as string || options.cursor;

  return {
    limit,
    cursor,
    field,
    direction,
  };
};

/**
 * Generate next cursor for cursor-based pagination
 */
export const generateNextCursor = (
  data: any[],
  field: string
): string | null => {
  if (data.length === 0) return null;
  
  const lastItem = data[data.length - 1];
  const cursorValue = lastItem[field];
  
  if (cursorValue === undefined || cursorValue === null) return null;
  
  // Base64 encode the cursor value
  return Buffer.from(String(cursorValue)).toString('base64');
};

/**
 * Decode cursor value
 */
export const decodeCursor = (cursor: string): string | null => {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch {
    return null;
  }
};