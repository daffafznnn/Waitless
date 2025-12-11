/* FILE: src/server/middleware/auth.ts */
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { Role } from '../models/user.model';

const authService = new AuthService();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: Role;
      };
    }
  }
}

/**
 * Middleware to verify JWT token from HttpOnly cookie or Authorization header
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from HttpOnly cookie or Authorization header
    const token = req.cookies.wlx_token || 
                 (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (!token) {
      res.status(401).json({
        ok: false,
        error: 'Authentication token required',
      });
      return;
    }

    // Verify token
    const payload = await authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      ok: false,
      error: error.message || 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to check if user has one of the required roles
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        ok: false,
        error: 'Insufficient permissions',
        details: `Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = requireRole(Role.ADMIN, Role.OWNER);

/**
 * Middleware for owner-only routes
 */
export const requireOwner = requireRole(Role.OWNER);

/**
 * Middleware for authenticated users (any role)
 */
export const requireAuth = authenticateToken;

/**
 * Optional authentication - sets user if token is provided, but doesn't fail if not
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from HttpOnly cookie or Authorization header
    const token = req.cookies.wlx_token || 
                 (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (token) {
      // Verify token
      const payload = await authService.verifyToken(token);

      // Attach user info to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }

    // Continue regardless of whether token was provided or valid
    next();
  } catch (error) {
    // If token verification fails, continue without user info
    next();
  }
};

/**
 * Middleware to check if user owns the resource or has admin/owner privileges
 */
export const requireOwnershipOrAdmin = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Owners and admins can access anything
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (resourceUserId && parseInt(resourceUserId) === user.userId) {
      next();
      return;
    }

    res.status(403).json({
      ok: false,
      error: 'Access denied - you can only access your own resources',
    });
  };
};

/**
 * Middleware to validate API key (for external integrations)
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    next(); // API key validation disabled if no key is set
    return;
  }

  if (!apiKey) {
    res.status(401).json({
      ok: false,
      error: 'API key required',
    });
    return;
  }

  if (apiKey !== validApiKey) {
    res.status(401).json({
      ok: false,
      error: 'Invalid API key',
    });
    return;
  }

  next();
};

/**
 * Middleware to rate limit requests (basic implementation)
 */
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const requestInfo = requestCounts.get(key);
    
    if (!requestInfo || now - requestInfo.timestamp > windowMs) {
      // Reset window
      requestCounts.set(key, { count: 1, timestamp: now });
      next();
      return;
    }
    
    if (requestInfo.count >= maxRequests) {
      res.status(429).json({
        ok: false,
        error: 'Too many requests',
        details: `Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes`,
      });
      return;
    }
    
    requestInfo.count++;
    next();
  };
};

/**
 * Middleware to log API requests
 */
export const logRequests = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const user = req.user ? `user:${req.user.userId}` : 'anonymous';
    
    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${user}`
    );
  });
  
  next();
};