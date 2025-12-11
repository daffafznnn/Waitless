/* FILE: src/server/routes/location.routes.ts */
import { Router } from 'express';
import { asyncHandler } from '../utils/response';
import { requireAuth, requireOwner, optionalAuth } from '../middleware/auth';
import * as locationController from '../controllers/location.controller';

const router = Router();

router.get('/', optionalAuth, asyncHandler(locationController.getLocations));
router.get('/:id', optionalAuth, asyncHandler(locationController.getLocationById));
router.get('/:id/counters', asyncHandler(locationController.getLocationCounters));
router.get('/:id/status', asyncHandler(locationController.getLocationStatus));

router.post('/', requireAuth, requireOwner, asyncHandler(locationController.createLocation));
router.put('/:id', requireAuth, requireOwner, asyncHandler(locationController.updateLocation));
router.delete('/:id', requireAuth, requireOwner, asyncHandler(locationController.deleteLocation));

router.post('/:id/members', requireAuth, requireOwner, asyncHandler(locationController.addLocationMember));
router.delete('/:id/members/:userId', requireAuth, requireOwner, asyncHandler(locationController.removeLocationMember));
router.get('/:id/members', requireAuth, requireOwner, asyncHandler(locationController.getLocationMembers));

export { router as locationRoutes };