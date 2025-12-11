/* FILE: src/server/controllers/admin.controller.ts */
import { Request, Response } from 'express';
import { z } from 'zod';
import { AdminService } from '../services/AdminService';

const adminService = new AdminService();

// Validation schemas
const createCounterSchema = z.object({
  locationId: z.number().int().positive('Location ID must be a positive integer'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name must be 120 characters or less'),
  description: z.string().max(255, 'Description must be 255 characters or less').optional(),
  prefix: z.string().min(1, 'Prefix is required').max(4, 'Prefix must be 4 characters or less'),
  openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Open time must be in HH:MM:SS format'),
  closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Close time must be in HH:MM:SS format'),
  capacityPerDay: z.number().int().min(0, 'Capacity must be non-negative'),
});

const updateCounterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name must be 120 characters or less').optional(),
  description: z.string().max(255, 'Description must be 255 characters or less').optional(),
  prefix: z.string().min(1, 'Prefix is required').max(4, 'Prefix must be 4 characters or less').optional(),
  openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Open time must be in HH:MM:SS format').optional(),
  closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Close time must be in HH:MM:SS format').optional(),
  capacityPerDay: z.number().int().min(0, 'Capacity must be non-negative').optional(),
  isActive: z.boolean().optional(),
});

/**
 * POST /api/admin/counters
 * Create a new counter
 */
export const createCounter = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate input
    const validatedData = createCounterSchema.parse(req.body);

    // Create counter
    const counter = await adminService.createCounter(adminUserId, validatedData);

    res.status(201).json({
      ok: true,
      data: { counter },
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
      error: error.message || 'Failed to create counter',
    });
  }
};

/**
 * PUT /api/admin/counters/:counterId
 * Update a counter
 */
export const updateCounter = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const counterId = parseInt(req.params.counterId);

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(counterId) || counterId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid counter ID',
      });
      return;
    }

    // Validate input
    const validatedData = updateCounterSchema.parse(req.body);

    // Update counter
    const counter = await adminService.updateCounter(adminUserId, counterId, validatedData);

    res.json({
      ok: true,
      data: { counter },
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
      error: error.message || 'Failed to update counter',
    });
  }
};

/**
 * DELETE /api/admin/counters/:counterId
 * Delete a counter
 */
export const deleteCounter = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const counterId = parseInt(req.params.counterId);

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(counterId) || counterId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid counter ID',
      });
      return;
    }

    // Delete counter
    await adminService.deleteCounter(adminUserId, counterId);

    res.json({
      ok: true,
      data: { message: 'Counter deleted successfully' },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to delete counter',
    });
  }
};

/**
 * GET /api/admin/locations/:locationId/counters
 * Get all counters for a location
 */
export const getLocationCounters = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const locationId = parseInt(req.params.locationId);

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }

    // Get counters
    const counters = await adminService.getLocationCounters(adminUserId, locationId);

    res.json({
      ok: true,
      data: { counters },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get counters',
    });
  }
};

/**
 * GET /api/admin/locations/:locationId/counters/status
 * Get counters with their status for a specific date
 */
export const getCountersWithStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const locationId = parseInt(req.params.locationId);
    const date = req.query.date as string | undefined;

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }

    // Get counters with status
    const counters = await adminService.getCountersWithStatus(adminUserId, locationId, date);

    res.json({
      ok: true,
      data: { counters },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get counters status',
    });
  }
};

/**
 * GET /api/admin/counters/:counterId/queue
 * Get queue status for a counter
 */
export const getQueueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const counterId = parseInt(req.params.counterId);
    const date = req.query.date as string | undefined;

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(counterId) || counterId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid counter ID',
      });
      return;
    }

    // Get queue status
    const status = await adminService.getQueueStatus(adminUserId, counterId, date);

    res.json({
      ok: true,
      data: { status },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get queue status',
    });
  }
};

/**
 * GET /api/admin/locations/:locationId/activity
 * Get activity log for a location
 */
export const getLocationActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const locationId = parseInt(req.params.locationId);
    const date = req.query.date as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }

    // Get activity log
    const activity = await adminService.getLocationActivity(adminUserId, locationId, date, page, limit);

    res.json({
      ok: true,
      data: {
        activity: activity.rows,
        pagination: {
          total: activity.count,
          page,
          limit,
          pages: Math.ceil(activity.count / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get activity log',
    });
  }
};

/**
 * GET /api/admin/counters/:counterId/activity
 * Get activity log for a counter
 */
export const getCounterActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const counterId = parseInt(req.params.counterId);
    const date = req.query.date as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(counterId) || counterId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid counter ID',
      });
      return;
    }

    // Get activity log
    const activity = await adminService.getCounterActivity(adminUserId, counterId, date, page, limit);

    res.json({
      ok: true,
      data: {
        activity: activity.rows,
        pagination: {
          total: activity.count,
          page,
          limit,
          pages: Math.ceil(activity.count / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get activity log',
    });
  }
};

/**
 * GET /api/admin/locations/:locationId/summary
 * Get daily summary for a location
 */
export const getDailySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const locationId = parseInt(req.params.locationId);
    const date = req.query.date as string | undefined;

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }

    // Get daily summary
    const summary = await adminService.getDailySummary(adminUserId, locationId, date);

    res.json({
      ok: true,
      data: { summary },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get daily summary',
    });
  }
};

/**
 * GET /api/admin/locations/:locationId/dashboard
 * Get dashboard statistics for a location
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;
    const locationId = parseInt(req.params.locationId);
    const date = req.query.date as string | undefined;

    if (!adminUserId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }

    // Get dashboard stats
    const stats = await adminService.getDashboardStats(adminUserId, locationId, date);

    res.json({
      ok: true,
      data: { stats },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get dashboard stats',
    });
  }
};