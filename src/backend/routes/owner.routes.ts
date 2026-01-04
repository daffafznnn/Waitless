/* FILE: src/server/routes/owner.routes.ts */
import { Router } from 'express';
import { asyncHandler } from '../utils/response';
import { requireAuth, requireOwner } from '../utils/auth-middleware';
import * as ownerController from '../controllers/owner.controller';

const router = Router();

// All owner routes require authentication and owner role
router.use(requireAuth);
router.use(requireOwner);

// Location management
router.get('/locations', asyncHandler(ownerController.getMyLocations));
router.get('/locations/top-performing', asyncHandler(ownerController.getTopPerformingLocations));
router.get('/locations/:locationId', asyncHandler(ownerController.getLocationById));
router.post('/locations', asyncHandler(ownerController.createLocation));
router.put('/locations/:locationId', asyncHandler(ownerController.updateLocation));
router.delete('/locations/:locationId', asyncHandler(ownerController.deleteLocation));

// Counter management (CRUD for counters within owner's locations)
router.get('/locations/:locationId/counters', asyncHandler(ownerController.getLocationCounters));
router.post('/locations/:locationId/counters', asyncHandler(ownerController.createCounter));
router.put('/counters/:counterId', asyncHandler(ownerController.updateCounter));
router.delete('/counters/:counterId', asyncHandler(ownerController.deleteCounter));

// Analytics & Reports
router.get('/locations/:locationId/analytics', asyncHandler(ownerController.getLocationAnalytics));
router.get('/locations/:locationId/report', asyncHandler(ownerController.generateLocationReport));

// Dashboard
router.get('/dashboard', asyncHandler(ownerController.getOwnerDashboard));

// Reports - Get all tickets for owner's locations
router.get('/tickets', asyncHandler(ownerController.getOwnerTickets));

// Staff management
router.get('/staff', asyncHandler(ownerController.getStaffList));
router.post('/staff', asyncHandler(ownerController.inviteStaff));
router.put('/staff/:staffId', asyncHandler(ownerController.updateStaff));
router.patch('/staff/:staffId/status', asyncHandler(ownerController.toggleStaffStatus));
router.delete('/staff/:staffId', asyncHandler(ownerController.removeStaff));

export { router as ownerRoutes };
