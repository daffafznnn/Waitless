/* FILE: src/server/controllers/location.controller.ts */
import { Request, Response } from 'express';
import { z } from 'zod';
import { LocationService } from '../services/LocationService';

const locationService = new LocationService();

const createLocationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name must be 120 characters or less'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(255, 'Address must be 255 characters or less'),
  phone: z.string().optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

const updateLocationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name must be 120 characters or less').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters').max(255, 'Address must be 255 characters or less').optional(),
  phone: z.string().optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

const addMemberSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export const getLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const locations = await locationService.getLocations(page, limit);
    
    res.json({
      ok: true,
      data: locations,
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get locations',
    });
  }
};

export const getLocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = parseInt(req.params.id);
    
    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }
    
    const location = await locationService.getLocationById(locationId);
    
    if (!location) {
      res.status(404).json({
        ok: false,
        error: 'Location not found',
      });
      return;
    }
    
    res.json({
      ok: true,
      data: { location },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get location',
    });
  }
};

export const createLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).user?.userId;
    if (!ownerId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    const validatedData = createLocationSchema.parse(req.body);
    
    const location = await locationService.createLocation({
      ...validatedData,
      ownerId,
    });
    
    res.status(201).json({
      ok: true,
      data: { location },
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
      error: error.message || 'Failed to create location',
    });
  }
};

export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const locationId = parseInt(req.params.id);
    
    if (!userId) {
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

    const validatedData = updateLocationSchema.parse(req.body);
    
    const location = await locationService.updateLocation(locationId, validatedData, userId);
    
    res.json({
      ok: true,
      data: { location },
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
      error: error.message || 'Failed to update location',
    });
  }
};

export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const locationId = parseInt(req.params.id);
    
    if (!userId) {
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
    
    await locationService.deleteLocation(locationId, userId);
    
    res.json({
      ok: true,
      data: { message: 'Location deleted successfully' },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to delete location',
    });
  }
};

export const getLocationCounters = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = parseInt(req.params.id);
    
    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }
    
    const counters = await locationService.getLocationCounters(locationId);
    
    res.json({
      ok: true,
      data: { counters },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get location counters',
    });
  }
};

export const getLocationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = parseInt(req.params.id);
    const date = req.query.date as string | undefined;
    
    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }
    
    const status = await locationService.getLocationStatus(locationId, date);
    
    res.json({
      ok: true,
      data: { status },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get location status',
    });
  }
};

export const addLocationMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).user?.userId;
    const locationId = parseInt(req.params.id);
    
    if (!ownerId) {
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

    const validatedData = addMemberSchema.parse(req.body);
    
    const member = await locationService.addLocationMember(locationId, validatedData.userId, ownerId);
    
    res.status(201).json({
      ok: true,
      data: { member },
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
      error: error.message || 'Failed to add location member',
    });
  }
};

export const removeLocationMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).user?.userId;
    const locationId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (!ownerId) {
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

    if (isNaN(userId) || userId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid user ID',
      });
      return;
    }
    
    await locationService.removeLocationMember(locationId, userId, ownerId);
    
    res.json({
      ok: true,
      data: { message: 'Location member removed successfully' },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to remove location member',
    });
  }
};

export const getLocationMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const locationId = parseInt(req.params.id);
    
    if (!userId) {
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
    
    const members = await locationService.getLocationMembers(locationId, userId);
    
    res.json({
      ok: true,
      data: { members },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get location members',
    });
  }
};