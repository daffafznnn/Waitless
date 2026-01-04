/* FILE: src/server/controllers/owner.controller.ts */
import type { Request, Response } from 'express';
import { OwnerService } from '../services/OwnerService';
import { sendSuccess, sendErrorResponse } from '../utils/response';

const ownerService = new OwnerService();

/**
 * Get all locations owned by current user
 */
export const getMyLocations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  const locations = await ownerService.getMyLocations(userId);
  
  sendSuccess(res, {
    locations,
    count: locations.length
  });
};

/**
 * Get a specific location by ID (must be owned by user)
 */
export const getLocationById = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const locationId = parseInt(req.params.locationId, 10);
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(locationId)) {
    sendErrorResponse(res, 'Invalid location ID', 400);
    return;
  }

  try {
    const location = await ownerService.getLocationById(userId, locationId);
    sendSuccess(res, { location });
  } catch (error: any) {
    if (error.message === 'Location not found' || error.message === 'Access denied') {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

/**
 * Create a new location
 */
export const createLocation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { name, address, city, lat, lng } = req.body;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    sendErrorResponse(res, 'Location name is required', 400);
    return;
  }

  try {
    const location = await ownerService.createLocation(userId, {
      name: name.trim(),
      address,
      city,
      lat,
      lng
    });

    sendSuccess(res, { location }, 201);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      sendErrorResponse(res, error.message, 409);
    } else if (error.message.includes('Only owners')) {
      sendErrorResponse(res, error.message, 403);
    } else {
      throw error;
    }
  }
};

/**
 * Update an existing location
 */
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const locationId = parseInt(req.params.locationId, 10);
  const { name, address, city, lat, lng, isActive } = req.body;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(locationId)) {
    sendErrorResponse(res, 'Invalid location ID', 400);
    return;
  }

  try {
    const location = await ownerService.updateLocation(userId, locationId, {
      name,
      address,
      city,
      lat,
      lng,
      isActive
    });

    sendSuccess(res, { location });
  } catch (error: any) {
    if (error.message === 'Location not found') {
      sendErrorResponse(res, error.message, 404);
    } else if (error.message.includes('only update your own')) {
      sendErrorResponse(res, error.message, 403);
    } else if (error.message.includes('already exists')) {
      sendErrorResponse(res, error.message, 409);
    } else {
      throw error;
    }
  }
};

/**
 * Delete a location
 */
export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const locationId = parseInt(req.params.locationId, 10);
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(locationId)) {
    sendErrorResponse(res, 'Invalid location ID', 400);
    return;
  }

  try {
    await ownerService.deleteLocation(userId, locationId);
    sendSuccess(res, { message: 'Location deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Location not found') {
      sendErrorResponse(res, error.message, 404);
    } else if (error.message.includes('only delete your own')) {
      sendErrorResponse(res, error.message, 403);
    } else {
      throw error;
    }
  }
};

/**
 * Get owner dashboard (aggregated stats for all locations)
 */
export const getOwnerDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { date } = req.query;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  const dashboard = await ownerService.getOwnerDashboard(userId, date as string | undefined);
  sendSuccess(res, dashboard);
};

/**
 * Get owner's tickets for reports (across all locations)
 */
export const getOwnerTickets = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { startDate, endDate, locationId, status } = req.query;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (!startDate || !endDate) {
    sendErrorResponse(res, 'Start date and end date are required', 400);
    return;
  }

  try {
    const result = await ownerService.getOwnerTickets(
      userId,
      startDate as string,
      endDate as string,
      locationId ? parseInt(locationId as string, 10) : undefined,
      status as string | undefined
    );
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('not owned')) {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

/**
 * Get location analytics for a date range
 */
export const getLocationAnalytics = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const locationId = parseInt(req.params.locationId, 10);
  const { startDate, endDate } = req.query;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(locationId)) {
    sendErrorResponse(res, 'Invalid location ID', 400);
    return;
  }

  if (!startDate || !endDate) {
    sendErrorResponse(res, 'Start date and end date are required', 400);
    return;
  }

  try {
    const analytics = await ownerService.getLocationAnalytics(
      userId,
      locationId,
      startDate as string,
      endDate as string
    );
    
    sendSuccess(res, analytics);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

/**
 * Generate location report
 */
export const generateLocationReport = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const locationId = parseInt(req.params.locationId, 10);
  const { startDate, endDate } = req.query;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(locationId)) {
    sendErrorResponse(res, 'Invalid location ID', 400);
    return;
  }

  if (!startDate || !endDate) {
    sendErrorResponse(res, 'Start date and end date are required', 400);
    return;
  }

  try {
    const report = await ownerService.generateLocationReport(
      userId,
      locationId,
      startDate as string,
      endDate as string
    );
    
    sendSuccess(res, report);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

/**
 * Get top performing locations
 */
export const getTopPerformingLocations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { date, limit } = req.query;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  const topLocations = await ownerService.getTopPerformingLocations(
    userId,
    date as string | undefined,
    limit ? parseInt(limit as string, 10) : 5
  );
  
  sendSuccess(res, topLocations);
};

// ========== COUNTER MANAGEMENT ==========

/**
 * Get all counters for a location
 */
export const getLocationCounters = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const locationId = parseInt(req.params.locationId, 10);
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(locationId)) {
    sendErrorResponse(res, 'Invalid location ID', 400);
    return;
  }

  try {
    const counters = await ownerService.getLocationCounters(userId, locationId);
    sendSuccess(res, { counters });
  } catch (error: any) {
    if (error.message === 'Location not found' || error.message === 'Access denied') {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

/**
 * Create a new counter in a location
 */
export const createCounter = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const locationId = parseInt(req.params.locationId, 10);
  const { name, description, prefix, openTime, closeTime, capacityPerDay } = req.body;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(locationId)) {
    sendErrorResponse(res, 'Invalid location ID', 400);
    return;
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    sendErrorResponse(res, 'Counter name must be at least 2 characters', 400);
    return;
  }

  if (!prefix || typeof prefix !== 'string' || prefix.trim().length < 1) {
    sendErrorResponse(res, 'Counter prefix is required', 400);
    return;
  }

  try {
    const counter = await ownerService.createCounter(userId, locationId, {
      name: name.trim(),
      description,
      prefix: prefix.trim().toUpperCase(),
      openTime: openTime || '08:00:00',
      closeTime: closeTime || '17:00:00',
      capacityPerDay: capacityPerDay || 100
    });

    sendSuccess(res, { counter }, 201);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      sendErrorResponse(res, error.message, 404);
    } else if (error.message.includes('already exists')) {
      sendErrorResponse(res, error.message, 409);
    } else {
      throw error;
    }
  }
};

/**
 * Update a counter
 */
export const updateCounter = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const counterId = parseInt(req.params.counterId, 10);
  const { name, description, prefix, openTime, closeTime, capacityPerDay, isActive } = req.body;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(counterId)) {
    sendErrorResponse(res, 'Invalid counter ID', 400);
    return;
  }

  try {
    const counter = await ownerService.updateCounter(userId, counterId, {
      name,
      description,
      prefix,
      openTime,
      closeTime,
      capacityPerDay,
      isActive
    });

    sendSuccess(res, { counter });
  } catch (error: any) {
    if (error.message === 'Counter not found' || error.message === 'Access denied') {
      sendErrorResponse(res, error.message, 404);
    } else if (error.message.includes('already exists')) {
      sendErrorResponse(res, error.message, 409);
    } else {
      throw error;
    }
  }
};

/**
 * Delete a counter
 */
export const deleteCounter = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const counterId = parseInt(req.params.counterId, 10);
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(counterId)) {
    sendErrorResponse(res, 'Invalid counter ID', 400);
    return;
  }

  try {
    await ownerService.deleteCounter(userId, counterId);
    sendSuccess(res, { message: 'Counter deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Counter not found' || error.message === 'Access denied') {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

// ========== STAFF MANAGEMENT ==========

/**
 * Get all staff for owner's locations
 */
export const getStaffList = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  try {
    const staff = await ownerService.getAllStaffForOwner(userId);
    sendSuccess(res, { staff, count: staff.length });
  } catch (error: any) {
    throw error;
  }
};

/**
 * Invite/create a new staff member
 */
export const inviteStaff = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { email, name, locationId, role, password } = req.body;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (!email || typeof email !== 'string') {
    sendErrorResponse(res, 'Email is required', 400);
    return;
  }

  if (!name || typeof name !== 'string') {
    sendErrorResponse(res, 'Name is required', 400);
    return;
  }

  if (!locationId || isNaN(parseInt(locationId))) {
    sendErrorResponse(res, 'Valid location ID is required', 400);
    return;
  }

  if (!role || !['ADMIN', 'VISITOR', 'OWNER'].includes(role)) {
    sendErrorResponse(res, 'Valid role is required (ADMIN, VISITOR, OWNER)', 400);
    return;
  }

  try {
    const staff = await ownerService.inviteStaff(userId, {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      locationId: parseInt(locationId),
      role,
      password
    });

    sendSuccess(res, { staff }, 201);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      sendErrorResponse(res, error.message, 404);
    } else if (error.message.includes('already')) {
      sendErrorResponse(res, error.message, 409);
    } else {
      throw error;
    }
  }
};

/**
 * Update staff member details
 */
export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const staffId = parseInt(req.params.staffId, 10);
  const { name, role, locationId } = req.body;
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(staffId)) {
    sendErrorResponse(res, 'Invalid staff ID', 400);
    return;
  }

  try {
    const staff = await ownerService.updateStaff(userId, staffId, {
      name,
      role,
      locationId
    });

    sendSuccess(res, { staff });
  } catch (error: any) {
    if (error.message === 'Staff not found' || error.message === 'Access denied') {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

/**
 * Toggle staff active status
 */
export const toggleStaffStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const staffId = parseInt(req.params.staffId, 10);
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(staffId)) {
    sendErrorResponse(res, 'Invalid staff ID', 400);
    return;
  }

  try {
    const staff = await ownerService.toggleStaffStatus(userId, staffId);
    sendSuccess(res, { staff });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};

/**
 * Remove staff member
 */
export const removeStaff = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const staffId = parseInt(req.params.staffId, 10);
  
  if (!userId) {
    sendErrorResponse(res, 'User not authenticated', 401);
    return;
  }

  if (isNaN(staffId)) {
    sendErrorResponse(res, 'Invalid staff ID', 400);
    return;
  }

  try {
    await ownerService.removeStaff(userId, staffId);
    sendSuccess(res, { message: 'Staff removed successfully' });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      sendErrorResponse(res, error.message, 404);
    } else {
      throw error;
    }
  }
};
