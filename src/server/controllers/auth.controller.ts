/* FILE: src/server/controllers/auth.controller.ts */
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';
import { Role } from '../models/user.model';

const authService = new AuthService();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['VISITOR', 'ADMIN', 'OWNER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Validate password strength
    const passwordValidation = authService.validatePassword(validatedData.password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        ok: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
      });
      return;
    }

    // Register user
    const result = await authService.register({
      ...validatedData,
      role: validatedData.role as Role
    });

    // Set HTTP-only cookie
    res.cookie('wlx_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      ok: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Registration failed',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Authenticate user
    const result = await authService.login(validatedData);

    // Set HTTP-only cookie
    res.cookie('wlx_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      ok: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(401).json({
      ok: false,
      error: error.message || 'Login failed',
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user by clearing cookies
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('wlx_token');
  res.json({
    ok: true,
    data: { message: 'Logged out successfully' },
  });
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    const profile = await authService.getProfile(userId);

    res.json({
      ok: true,
      data: { user: profile },
    });
  } catch (error: any) {
    res.status(404).json({
      ok: false,
      error: error.message || 'User not found',
    });
  }
};

/**
 * PUT /api/auth/profile
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate input
    const validatedData = updateProfileSchema.parse(req.body);

    // Update profile
    const updatedUser = await authService.updateProfile(userId, validatedData);

    res.json({
      ok: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Profile update failed',
    });
  }
};

/**
 * POST /api/auth/change-password
 * Change user password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate input
    const validatedData = changePasswordSchema.parse(req.body);

    // Validate new password strength
    const passwordValidation = authService.validatePassword(validatedData.newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        ok: false,
        error: 'New password does not meet requirements',
        details: passwordValidation.errors,
      });
      return;
    }

    // Change password
    await authService.changePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword
    );

    res.json({
      ok: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Password change failed',
    });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.wlx_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        ok: false,
        error: 'No token provided',
      });
      return;
    }

    const newToken = await authService.refreshToken(token);

    // Set new HTTP-only cookie
    res.cookie('wlx_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      ok: true,
      data: { token: newToken },
    });
  } catch (error: any) {
    res.status(401).json({
      ok: false,
      error: error.message || 'Token refresh failed',
    });
  }
};

/**
 * POST /api/auth/set-token
 * Set token as HTTP-only cookie (used by OAuth callback)
 */
export const setToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        ok: false,
        error: 'Token is required',
      });
      return;
    }

    // Verify token is valid by decoding it
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'waitless-jwt-secret-key';
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({
        ok: false,
        error: 'Invalid token',
      });
      return;
    }

    // Set HTTP-only cookie
    res.cookie('wlx_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      ok: true,
      data: { message: 'Token set successfully' },
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to set token',
    });
  }
};